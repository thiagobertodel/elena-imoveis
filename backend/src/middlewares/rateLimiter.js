const rateLimit = require('express-rate-limit');

/**
 * Rate limiter geral — 100 requisições a cada 15 minutos.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para rotas de autenticação — 5 tentativas a cada 15 minutos.
 * Proteção contra brute force.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para uploads — 500 requisições a cada 15 minutos (permite uploads em lote de 60+ fotos).
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Limite de uploads atingido. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});


module.exports = { generalLimiter, authLimiter, uploadLimiter };
