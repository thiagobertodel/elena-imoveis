const { query } = require('../database/connection');

/**
 * GET /api/v1/admin/properties
 * Lista imóveis pendentes de aprovação.
 */
async function listPendingProperties(req, res) {
  try {
    const { status = 'pendente', page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      'SELECT COUNT(*) as total FROM properties WHERE status = $1',
      [status]
    );
    const total = parseInt(countResult.rows[0].total);

    const result = await query(`
      SELECT p.*,
        (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) as cover_url,
        (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) as total_images,
        u.nome as anunciante_nome, u.email as anunciante_email
      FROM properties p
      JOIN users u ON u.id = p.user_id
      WHERE p.status = $1
      ORDER BY p.created_at ASC
      LIMIT $2 OFFSET $3
    `, [status, parseInt(limit), offset]);

    return res.json({
      properties: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Erro ao listar imóveis pendentes:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * PUT /api/v1/admin/properties/:id/approve
 * Aprova um anúncio.
 */
async function approveProperty(req, res) {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE properties SET status = 'ativo', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    return res.json({ message: 'Anúncio aprovado com sucesso', property: result.rows[0] });
  } catch (err) {
    console.error('Erro ao aprovar anúncio:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * PUT /api/v1/admin/properties/:id/reject
 * Rejeita um anúncio.
 */
async function rejectProperty(req, res) {
  try {
    const { id } = req.params;

    const result = await query(
      "UPDATE properties SET status = 'inativo', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    return res.json({ message: 'Anúncio rejeitado', property: result.rows[0] });
  } catch (err) {
    console.error('Erro ao rejeitar anúncio:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * PUT /api/v1/admin/properties/:id/feature
 * Destaca/remove destaque de um anúncio.
 */
async function toggleFeature(req, res) {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE properties SET destaque = NOT destaque, updated_at = NOW() WHERE id = $1 RETURNING id, destaque',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }

    const status = result.rows[0].destaque ? 'destacado' : 'removido do destaque';
    return res.json({ message: `Imóvel ${status}`, property: result.rows[0] });
  } catch (err) {
    console.error('Erro ao alterar destaque:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/admin/stats
 * Estatísticas gerais do sistema.
 */
async function getStats(req, res) {
  try {
    const [users, properties, pending, active] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM properties'),
      query("SELECT COUNT(*) as total FROM properties WHERE status = 'pendente'"),
      query("SELECT COUNT(*) as total FROM properties WHERE status = 'ativo'"),
    ]);

    return res.json({
      stats: {
        total_users: parseInt(users.rows[0].total),
        total_properties: parseInt(properties.rows[0].total),
        pending_properties: parseInt(pending.rows[0].total),
        active_properties: parseInt(active.rows[0].total),
      },
    });
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * GET /api/v1/admin/users
 * Lista todos os usuários.
 */
async function listUsers(req, res) {
  try {
    const result = await query(`
      SELECT id, nome, email, telefone, role, created_at,
        (SELECT COUNT(*) FROM properties WHERE user_id = users.id) as total_properties
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({ users: result.rows });
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = {
  listPendingProperties,
  approveProperty,
  rejectProperty,
  toggleFeature,
  getStats,
  listUsers,
};
