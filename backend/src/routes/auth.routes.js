const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const { handleValidation } = require('../utils/helpers');
const { loginValidation } = require('../utils/validators');
const authController = require('../controllers/auth.controller');

// Login público somente para o usuário administrativo.
router.post('/login', authLimiter, loginValidation, handleValidation, authController.login);

// Rotas protegidas
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

// LGPD
router.get('/my-data', authMiddleware, authController.exportMyData);
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;
