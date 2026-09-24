const { validationResult } = require('express-validator');

/**
 * Middleware que verifica erros de validação do express-validator.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  return next();
}

/**
 * Formata preço em Real brasileiro.
 */
function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Sanitiza string para prevenir XSS.
 */
function sanitize(str) {
  if (!str) return str;
  return str.replace(/[<>]/g, '');
}

module.exports = { handleValidation, formatBRL, sanitize };
