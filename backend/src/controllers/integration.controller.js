/**
 * Controller de Integrações com Portais Imobiliários (ZAP / Viva Real - VRSync)
 */

const { query } = require('../database/connection');
const {
  DEFAULT_INTEGRATION_ID,
  generateVRSyncXml,
  syncPropertiesValidation,
  logIntegrationEvent,
} = require('../services/vrsync.service');

/**
 * GET /api/v1/integrations/vrsync.xml
 * Endpoint público protegido por token para fornecimento do feed XML aos robôs do Grupo OLX
 */
async function getVRSyncFeed(req, res) {
  const token = req.query.token || req.headers['x-feed-token'];
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    // 1. Buscar integração ativa com o token fornecido
    const intResult = await query(
      'SELECT * FROM integrations WHERE provider = $1 AND enabled = true',
      ['vrsync']
    );

    if (intResult.rows.length === 0) {
      await logIntegrationEvent({
        eventType: 'feed_access_rejected',
        status: 'error',
        message: 'Acesso ao feed rejeitado: Nenhuma integração ativa encontrada',
        ipAddress: clientIp,
      });

      return res.status(503).type('application/xml').send(
        '<?xml version="1.0" encoding="UTF-8"?><Error>Integracao desativada ou nao configurada</Error>'
      );
    }

    const integration = intResult.rows[0];

    // Validação de token de segurança
    if (!token || token !== integration.feed_token) {
      await logIntegrationEvent({
        integrationId: integration.id,
        eventType: 'feed_access_unauthorized',
        status: 'warning',
        message: `Tentativa de acesso ao feed sem token valido. Token recebido: "${token || 'nenhum'}"`,
        ipAddress: clientIp,
      });

      return res.status(401).type('application/xml').send(
        '<?xml version="1.0" encoding="UTF-8"?><Error>Acesso nao autorizado. Forneca o token seguro via parametro ?token=SEU_TOKEN</Error>'
      );
    }

    // 2. Gerar o XML oficial
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const xml = await generateVRSyncXml(integration.id, baseUrl);

    // 3. Registrar auditoria de leitura do crawler
    await logIntegrationEvent({
      integrationId: integration.id,
      eventType: 'feed_access_success',
      status: 'success',
      message: 'Feed VRSync gerado e entregue com sucesso ao integrador',
      ipAddress: clientIp,
      payload: { userAgent: req.headers['user-agent'] },
    });

    // 4. Enviar com cabeçalho XML e cache controlado
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutos de cache HTTP
    return res.send(xml);
  } catch (err) {
    console.error('Erro ao gerar feed VRSync:', err);

    await logIntegrationEvent({
      eventType: 'feed_generation_error',
      status: 'error',
      message: `Erro interno ao gerar feed XML: ${err.message}`,
      ipAddress: clientIp,
    });

    return res.status(500).type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?><Error>Erro ao gerar feed: ${err.message}</Error>`
    );
  }
}

/**
 * GET /api/v1/admin/integrations
 * Lista dados gerais da integração, métricas e status dos imóveis
 */
async function getIntegrationDashboard(req, res) {
  try {
    const intResult = await query('SELECT * FROM integrations WHERE provider = $1', ['vrsync']);
    if (intResult.rows.length === 0) {
      return res.status(404).json({ error: 'Configuração de integração não encontrada' });
    }

    const integration = intResult.rows[0];

    // Buscar lista de imóveis com seu status de publicação no VRSync
    const propertiesResult = await query(`
      SELECT 
        p.id,
        p.titulo,
        p.preco,
        p.tipo,
        p.categoria,
        p.bairro,
        p.cidade,
        p.status as property_status,
        (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) as cover_url,
        (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as total_images,
        pp.status as publication_status,
        pp.eligible,
        pp.validation_errors,
        pp.external_id,
        pp.last_sync_at
      FROM properties p
      LEFT JOIN property_publications pp ON pp.property_id = p.id AND pp.integration_id = $1
      ORDER BY p.created_at DESC
    `, [integration.id]);

    const properties = propertiesResult.rows;

    const total = properties.length;
    const inFeed = properties.filter((p) => p.publication_status === 'disponivel_no_feed').length;
    const withErrors = properties.filter((p) => p.publication_status === 'erro').length;
    const disabled = properties.filter((p) => p.publication_status === 'desativado').length;
    const pendingValidation = properties.filter((p) => !p.publication_status || p.publication_status === 'aguardando_validacao').length;

    // Montar URL pública absoluta do feed
    const apiHost = req.get('host');
    const protocol = req.protocol;
    const fullFeedUrl = `${protocol}://${apiHost}/api/v1/integrations/vrsync.xml?token=${integration.feed_token}`;

    return res.json({
      integration: {
        ...integration,
        full_feed_url: fullFeedUrl,
      },
      stats: {
        total_properties: total,
        in_feed: inFeed,
        with_errors: withErrors,
        disabled,
        pending_validation: pendingValidation,
      },
      properties,
    });
  } catch (err) {
    console.error('Erro ao buscar dashboard de integrações:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados da integração' });
  }
}

/**
 * POST /api/v1/admin/integrations/sync
 * Força a revalidação e sincronização dos imóveis
 */
async function syncIntegrations(req, res) {
  try {
    const stats = await syncPropertiesValidation(DEFAULT_INTEGRATION_ID);
    return res.json({
      message: 'Sincronização de validação concluída com sucesso!',
      stats,
    });
  } catch (err) {
    console.error('Erro ao sincronizar integração:', err);
    return res.status(500).json({ error: 'Erro ao sincronizar imóveis' });
  }
}

/**
 * PUT /api/v1/admin/integrations/property/:propertyId/toggle
 * Ativa ou desativa a publicação de um imóvel individual no feed
 */
async function togglePropertyPublication(req, res) {
  try {
    const { propertyId } = req.params;

    const existingPub = await query(
      'SELECT * FROM property_publications WHERE property_id = $1 AND integration_id = $2',
      [propertyId, DEFAULT_INTEGRATION_ID]
    );

    let newStatus = 'desativado';

    if (existingPub.rows.length > 0) {
      const current = existingPub.rows[0];
      if (current.status === 'desativado') {
        newStatus = current.eligible ? 'disponivel_no_feed' : 'erro';
      } else {
        newStatus = 'desativado';
      }

      await query(
        `UPDATE property_publications 
         SET status = $1, updated_at = NOW() 
         WHERE property_id = $2 AND integration_id = $3`,
        [newStatus, propertyId, DEFAULT_INTEGRATION_ID]
      );
    } else {
      await query(
        `INSERT INTO property_publications (property_id, integration_id, status, external_id)
         VALUES ($1, $2, 'desativado', $3)`,
        [propertyId, DEFAULT_INTEGRATION_ID, `ELENA-${propertyId.substring(0, 8).toUpperCase()}`]
      );
    }

    await logIntegrationEvent({
      integrationId: DEFAULT_INTEGRATION_ID,
      eventType: 'property_toggle',
      status: 'success',
      message: `Status do imóvel ${propertyId} alterado para: ${newStatus}`,
      payload: { propertyId, newStatus, userId: req.userId },
    });

    return res.json({
      message: `Status de publicação alterado para: ${newStatus}`,
      status: newStatus,
    });
  } catch (err) {
    console.error('Erro ao alternar publicação do imóvel:', err);
    return res.status(500).json({ error: 'Erro ao alterar status de publicação' });
  }
}

/**
 * PUT /api/v1/admin/integrations/settings
 * Atualiza configurações da integração (ex: telefone, exibição de endereço, etc.)
 */
async function updateIntegrationSettings(req, res) {
  try {
    const { enabled, settings } = req.body;

    const currentRes = await query('SELECT settings FROM integrations WHERE id = $1', [DEFAULT_INTEGRATION_ID]);
    const currentSettings = currentRes.rows[0]?.settings || {};

    const updatedSettings = { ...currentSettings, ...(settings || {}) };

    const result = await query(
      `UPDATE integrations 
       SET enabled = COALESCE($1, enabled), 
           settings = $2, 
           updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [enabled !== undefined ? enabled : null, JSON.stringify(updatedSettings), DEFAULT_INTEGRATION_ID]
    );

    return res.json({
      message: 'Configurações da integração atualizadas com sucesso!',
      integration: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    return res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
}

/**
 * GET /api/v1/admin/integrations/logs
 * Retorna histórico de logs e acessos ao feed
 */
async function getIntegrationLogs(req, res) {
  try {
    const logsResult = await query(
      `SELECT * FROM integration_logs 
       WHERE integration_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [DEFAULT_INTEGRATION_ID]
    );

    return res.json({ logs: logsResult.rows });
  } catch (err) {
    console.error('Erro ao buscar logs:', err);
    return res.status(500).json({ error: 'Erro ao carregar logs' });
  }
}

module.exports = {
  getVRSyncFeed,
  getIntegrationDashboard,
  syncIntegrations,
  togglePropertyPublication,
  updateIntegrationSettings,
  getIntegrationLogs,
};
