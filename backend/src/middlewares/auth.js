const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT.
 * Verifica o token no header Authorization (Bearer <token>).
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

/**
 * Middleware opcional de autenticação.
 * Não bloqueia a requisição se não houver token, mas popula req.userId se houver.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
  } catch (err) {
    // Token inválido, mas não bloqueia
  }

  return next();
}

module.exports = { authMiddleware, optionalAuth };
