/**
 * Validador de conformidade dos imóveis com os requisitos obrigatórios do VRSync (Grupo OLX)
 */
const { CATEGORY_MAP, TRANSACTION_MAP } = require('./vrsync.mapper');

/**
 * Valida se um imóvel possui todas as informações necessárias para ser publicado no feed do ZAP / Viva Real.
 * @param {object} property - Objeto do imóvel com suas imagens
 * @returns {{ eligible: boolean, errors: string[] }}
 */
function validatePropertyForVRSync(property) {
  const errors = [];

  // 1. Status do Imóvel
  if (property.status !== 'ativo') {
    errors.push(`Imóvel não está ativo na plataforma (status atual: ${property.status}).`);
  }

  // 2. Título
  if (!property.titulo || property.titulo.trim().length < 5) {
    errors.push('Título obrigatório e deve ter no mínimo 5 caracteres.');
  }

  // 3. Descrição
  if (!property.descricao || property.descricao.trim().length < 10) {
    errors.push('Descrição obrigatória e deve ter no mínimo 10 caracteres explicativos.');
  }

  // 4. Preço
  const precoNum = parseFloat(property.preco);
  if (isNaN(precoNum) || precoNum <= 0) {
    errors.push('Preço é obrigatório e deve ser maior que zero.');
  }

  // 5. Finalidade / Tipo de Transação
  const normTipo = String(property.tipo || '').toLowerCase().trim();
  if (!TRANSACTION_MAP[normTipo]) {
    errors.push('Tipo de transação inválido. Deve ser "venda" ou "aluguel".');
  }

  // 6. Categoria / Tipo de Imóvel
  const normCat = String(property.categoria || '').toLowerCase().trim();
  if (!CATEGORY_MAP[normCat]) {
    errors.push(`Categoria "${property.categoria}" não é suportada pelo padrão VRSync.`);
  }

  // 7. Localização (Cidade e Bairro)
  if (!property.cidade || property.cidade.trim().length === 0) {
    errors.push('Cidade é um campo obrigatório.');
  }
  if (!property.bairro || property.bairro.trim().length === 0) {
    errors.push('Bairro é um campo obrigatório para indexação e busca nos portais.');
  }

  // 8. Imagens (O Grupo OLX exige no mínimo 1 fotografia pública)
  const images = property.images || [];
  const validPhotos = images.filter((img) => {
    const url = typeof img === 'string' ? img : img.image_url;
    return url && url.startsWith('http') && img.media_type !== 'video';
  });

  if (validPhotos.length === 0) {
    errors.push('O imóvel deve ter pelo menos 1 fotografia com URL pública válida.');
  }

  // 9. Metragem / Área Útil
  if (normCat !== 'terreno' && (!property.area || property.area <= 0)) {
    errors.push('Área útil (m²) é recomendada e deve ser maior que zero para imóveis residenciais.');
  }

  return {
    eligible: errors.length === 0,
    errors,
  };
}

module.exports = {
  validatePropertyForVRSync,
};
