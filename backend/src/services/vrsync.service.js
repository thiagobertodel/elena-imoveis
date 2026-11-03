/**
 * Serviço de Integração VRSync (Grupo OLX — ZAP Imóveis e Viva Real)
 * Responsável por:
 * 1. Avaliar elegibilidade dos imóveis
 * 2. Atualizar status na tabela property_publications
 * 3. Gerar o XML oficial e estritamente formatado
 * 4. Registrar logs de auditoria
 */

const { query } = require('../database/connection');
const { 
  escapeXml, 
  cdata, 
  mapPropertyType, 
  mapTransactionType, 
  mapFeature 
} = require('./vrsync.mapper');
const { validatePropertyForVRSync } = require('./vrsync.validator');

const DEFAULT_INTEGRATION_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Registra um log de evento da integração para auditoria
 */
async function logIntegrationEvent({
  integrationId = DEFAULT_INTEGRATION_ID,
  eventType,
  status = 'success',
  message,
  payload = {},
  ipAddress = null,
}) {
  try {
    await query(
      `INSERT INTO integration_logs (integration_id, event_type, status, message, payload, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [integrationId, eventType, status, message, JSON.stringify(payload), ipAddress]
    );
  } catch (err) {
    console.error('Erro ao gravar log da integração:', err.message);
  }
}

/**
 * Revalida todos os imóveis da base contra o VRSync e atualiza a tabela property_publications
 */
async function syncPropertiesValidation(integrationId = DEFAULT_INTEGRATION_ID) {
  // 1. Obter todos os imóveis com suas imagens
  const propertiesResult = await query(`
    SELECT p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'image_url', pi.image_url,
            'is_cover', pi.is_cover,
            'media_type', COALESCE(pi.media_type, 'image')
          ) ORDER BY pi.is_cover DESC, pi.created_at ASC
        ) FILTER (WHERE pi.id IS NOT NULL), '[]'
      ) as images,
      pp.id as publication_id,
      pp.status as current_status,
      pp.external_id
    FROM properties p
    LEFT JOIN property_images pi ON pi.property_id = p.id
    LEFT JOIN property_publications pp ON pp.property_id = p.id AND pp.integration_id = $1
    GROUP BY p.id, pp.id, pp.status, pp.external_id
    ORDER BY p.created_at DESC
  `, [integrationId]);

  const properties = propertiesResult.rows;

  let totalEligible = 0;
  let totalWithErrors = 0;
  let totalDisabled = 0;
  let totalInFeed = 0;

  for (const prop of properties) {
    const validation = validatePropertyForVRSync(prop);

    let newStatus = prop.current_status;

    // Se o corretor/administrador optou por desativar manualmente a publicação deste imóvel
    if (prop.current_status === 'desativado') {
      newStatus = 'desativado';
      totalDisabled++;
    } else if (prop.status !== 'ativo') {
      newStatus = 'desativado';
      totalDisabled++;
    } else if (validation.eligible) {
      newStatus = 'disponivel_no_feed';
      totalEligible++;
      totalInFeed++;
    } else {
      newStatus = 'erro';
      totalWithErrors++;
    }

    const externalId = prop.external_id || `ELENA-${prop.id.substring(0, 8).toUpperCase()}`;

    await query(`
      INSERT INTO property_publications (
        property_id, 
        integration_id, 
        external_id, 
        status, 
        eligible, 
        validation_errors, 
        last_sync_at, 
        error_message, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW())
      ON CONFLICT (property_id, integration_id) DO UPDATE SET
        external_id = EXCLUDED.external_id,
        status = EXCLUDED.status,
        eligible = EXCLUDED.eligible,
        validation_errors = EXCLUDED.validation_errors,
        last_sync_at = NOW(),
        error_message = EXCLUDED.error_message,
        updated_at = NOW()
    `, [
      prop.id,
      integrationId,
      externalId,
      newStatus,
      validation.eligible,
      JSON.stringify(validation.errors),
      validation.errors.join('; ') || null,
    ]);
  }

  // Atualizar data da última sincronização na integração
  await query('UPDATE integrations SET last_sync_at = NOW(), updated_at = NOW() WHERE id = $1', [integrationId]);

  await logIntegrationEvent({
    integrationId,
    eventType: 'validation_run',
    status: 'success',
    message: `Sincronização de validação executada. ${totalInFeed} imóveis disponíveis no feed, ${totalWithErrors} com erros, ${totalDisabled} desativados.`,
    payload: { total: properties.length, eligible: totalEligible, inFeed: totalInFeed, errors: totalWithErrors, disabled: totalDisabled },
  });

  return {
    total: properties.length,
    eligible: totalEligible,
    inFeed: totalInFeed,
    errors: totalWithErrors,
    disabled: totalDisabled,
  };
}

/**
 * Gera o XML oficial do VRSync para os portais ZAP Imóveis e Viva Real
 */
async function generateVRSyncXml(integrationId = DEFAULT_INTEGRATION_ID, baseUrl = 'http://localhost:3000') {
  // 1. Obter dados da integração
  const intResult = await query('SELECT * FROM integrations WHERE id = $1', [integrationId]);
  if (intResult.rows.length === 0) {
    throw new Error('Integração não encontrada');
  }

  const integration = intResult.rows[0];
  const settings = integration.settings || {};
  const publisherName = settings.publisher_name || 'Elena Imóveis';
  const contactEmail = settings.contact_email || 'contato@elenaimoveis.com.br';
  const contactPhone = settings.contact_phone || '(51) 99961-2190';
  const displayAddress = settings.display_address || 'Neighborhood';

  // 2. Revalidar e sincronizar publicações
  await syncPropertiesValidation(integrationId);

  // 3. Buscar apenas os imóveis que estão marcados como 'disponivel_no_feed'
  const feedPropertiesResult = await query(`
    SELECT p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'image_url', pi.image_url,
            'is_cover', pi.is_cover,
            'media_type', COALESCE(pi.media_type, 'image')
          ) ORDER BY pi.is_cover DESC, pi.created_at ASC
        ) FILTER (WHERE pi.id IS NOT NULL), '[]'
      ) as images,
      pp.external_id
    FROM properties p
    JOIN property_publications pp ON pp.property_id = p.id AND pp.integration_id = $1
    LEFT JOIN property_images pi ON pi.property_id = p.id
    WHERE pp.status = 'disponivel_no_feed' AND p.status = 'ativo'
    GROUP BY p.id, pp.external_id
    ORDER BY p.destaque DESC, p.created_at DESC
  `, [integrationId]);

  const activeProperties = feedPropertiesResult.rows;
  const nowIso = new Date().toISOString().split('.')[0]; // Formato YYYY-MM-DDTHH:MM:SS

  // 4. Construção do XML VRSync (Especificação Oficial Grupo ZAP / Viva Real)
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://spbrintegra.vivareal.com.br/spbrintegra.xsd">
  <Header>
    <Provider>${escapeXml(publisherName)}</Provider>
    <Email>${escapeXml(contactEmail)}</Email>
    <ContactName>${escapeXml(publisherName)}</ContactName>
    <PublishDate>${nowIso}</PublishDate>
  </Header>
  <Listings>
`;

  for (const prop of activeProperties) {
    const listingId = prop.external_id || prop.id;
    const transactionType = mapTransactionType(prop.tipo);
    const propertyType = mapPropertyType(prop.categoria);
    const propertyUrl = `${baseUrl.replace(/\/$/, '')}/imovel/${prop.id}`;

    xml += `    <Listing>
      <ListingID>${escapeXml(listingId)}</ListingID>
      <Title>${cdata(prop.titulo)}</Title>
      <TransactionType>${escapeXml(transactionType)}</TransactionType>
      <DetailViewUrl>${escapeXml(propertyUrl)}</DetailViewUrl>
      <Media>
`;

    // Fotos do imóvel
    const photos = (prop.images || []).filter((img) => img.media_type !== 'video' && img.image_url);
    photos.forEach((img, index) => {
      const caption = img.is_cover ? 'Foto Principal' : `Foto ${index + 1}`;
      xml += `        <Item medium="image" caption="${escapeXml(caption)}">${escapeXml(img.image_url)}</Item>\n`;
    });

    // Vídeo do imóvel (se houver)
    const videoUrl = prop.video_url || (prop.images || []).find((img) => img.media_type === 'video')?.image_url;
    if (videoUrl) {
      xml += `        <Item medium="video">${escapeXml(videoUrl)}</Item>\n`;
    }

    xml += `      </Media>
      <Details>
        <PropertyType>${escapeXml(propertyType)}</PropertyType>
        <Description>${cdata(prop.descricao || prop.titulo)}</Description>
        <ListPrice currency="BRL">${Math.round(parseFloat(prop.preco))}</ListPrice>
`;

    if (prop.area && prop.area > 0) {
      xml += `        <LivingArea unit="square metres">${parseInt(prop.area)}</LivingArea>\n`;
    }
    if (prop.quartos !== null && prop.quartos !== undefined) {
      xml += `        <Bedrooms>${parseInt(prop.quartos)}</Bedrooms>\n`;
    }
    if (prop.banheiros !== null && prop.banheiros !== undefined) {
      xml += `        <Bathrooms>${parseInt(prop.banheiros)}</Bathrooms>\n`;
    }
    if (prop.garagem !== null && prop.garagem !== undefined) {
      xml += `        <Garage type="Parking Space">${parseInt(prop.garagem)}</Garage>\n`;
    }

    xml += `      </Details>
      <Location displayAddress="${escapeXml(displayAddress)}">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="RS">Rio Grande do Sul</State>
        <City>${escapeXml(prop.cidade || 'Porto Alegre')}</City>
        <Neighborhood>${escapeXml(prop.bairro || 'Centro')}</Neighborhood>
`;

    if (prop.endereco) {
      xml += `        <Address>${escapeXml(prop.endereco)}</Address>\n`;
    }
    if (prop.cep) {
      xml += `        <PostalCode>${escapeXml(prop.cep.replace(/\D/g, ''))}</PostalCode>\n`;
    }
    if (prop.latitude && prop.longitude) {
      xml += `        <Latitude>${parseFloat(prop.latitude).toFixed(6)}</Latitude>\n`;
      xml += `        <Longitude>${parseFloat(prop.longitude).toFixed(6)}</Longitude>\n`;
    }

    xml += `      </Location>
      <ContactInfo>
        <Name>${escapeXml(publisherName)}</Name>
        <Email>${escapeXml(contactEmail)}</Email>
        <Telephone>${escapeXml(contactPhone)}</Telephone>
      </ContactInfo>
    </Listing>
`;
  }

  xml += `  </Listings>
</ListingDataFeed>`;

  return xml;
}

module.exports = {
  DEFAULT_INTEGRATION_ID,
  logIntegrationEvent,
  syncPropertiesValidation,
  generateVRSyncXml,
};
