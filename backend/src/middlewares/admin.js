/**
 * Middleware de verificação de admin.
 * Deve ser usado APÓS o middleware de auth.
 */
function adminMiddleware(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  return next();
}

module.exports = { adminMiddleware };
