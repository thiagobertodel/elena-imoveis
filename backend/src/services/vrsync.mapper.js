/**
 * Mapeador de dados do Elena Imóveis para o padrão VRSync (Grupo OLX: ZAP Imóveis e Viva Real)
 * Documentação de Referência: https://developers.grupozap.com/
 */

// Mapeamento de categorias de imóveis
const CATEGORY_MAP = {
  apartamento: 'Residential / Apartment',
  casa: 'Residential / Home',
  cobertura: 'Residential / Penthouse',
  terreno: 'Land / Residential Land',
  comercial: 'Commercial / Office',
  kitnet: 'Residential / Kitnet',
};

// Mapeamento de finalidade
const TRANSACTION_MAP = {
  venda: 'For Sale',
  aluguel: 'For Rent',
};

// Mapeamento de comodidades e diferenciais para termos reconhecidos pelo Grupo OLX
const FEATURE_MAP = {
  'piscina': 'Pool',
  'churrasqueira': 'Barbecue Grill',
  'ar condicionado': 'Air Conditioning',
  'academia': 'Gym',
  'elevador': 'Elevator',
  'portaria 24h': 'Gated Community',
  'sacada': 'Balcony',
  'varanda': 'Balcony',
  'playground': 'Playground',
  'salao de festas': 'Party Room',
  'salão de festas': 'Party Room',
  'quadra poliesportiva': 'Sports Court',
  'jardim': 'Garden',
  'mobiliado': 'Furnished',
  'semi mobiliado': 'Semi Furnished',
  'aquecimento a gas': 'Gas Heating',
  'aquecimento a gás': 'Gas Heating',
  'vista para o rio': 'Water View',
  'vista panoramica': 'Panoramic View',
  'vista panorâmica': 'Panoramic View',
};

/**
 * Escapa caracteres especiais XML para segurança
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Cria bloco CDATA seguro
 */
function cdata(str) {
  if (!str) return '<![CDATA[]]>';
  const cleanStr = String(str).replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${cleanStr}]]>`;
}

/**
 * Mapeia uma característica para o padrão VRSync
 */
function mapFeature(feat) {
  if (!feat) return null;
  const normalized = String(feat).toLowerCase().trim();
  return FEATURE_MAP[normalized] || feat;
}

/**
 * Mapeia o tipo de imóvel para o formato VRSync
 */
function mapPropertyType(category) {
  const norm = String(category || '').toLowerCase().trim();
  return CATEGORY_MAP[norm] || 'Residential / Apartment';
}

/**
 * Mapeia o tipo de transação (venda / aluguel)
 */
function mapTransactionType(tipo) {
  const norm = String(tipo || '').toLowerCase().trim();
  return TRANSACTION_MAP[norm] || 'For Sale';
}

module.exports = {
  CATEGORY_MAP,
  TRANSACTION_MAP,
  FEATURE_MAP,
  escapeXml,
  cdata,
  mapFeature,
  mapPropertyType,
  mapTransactionType,
};
