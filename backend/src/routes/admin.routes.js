const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { adminMiddleware } = require('../middlewares/admin');
const adminController = require('../controllers/admin.controller');

// Todas as rotas requerem autenticação + role admin
router.use(authMiddleware, adminMiddleware);

router.get('/properties', adminController.listPendingProperties);
router.put('/properties/:id/approve', adminController.approveProperty);
router.put('/properties/:id/reject', adminController.rejectProperty);
router.put('/properties/:id/feature', adminController.toggleFeature);
router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);

module.exports = router;
