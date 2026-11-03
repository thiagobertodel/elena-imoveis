const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { adminMiddleware } = require('../middlewares/admin');
const integrationController = require('../controllers/integration.controller');

// 1. Rota Pública do Feed XML para o Grupo OLX (ZAP / Viva Real)
// Acessível via /api/v1/integrations/vrsync.xml?token=...
router.get('/vrsync.xml', integrationController.getVRSyncFeed);

// 2. Rotas Administrativas de Gerenciamento da Integração (Requerem login de Administrador)
router.get('/admin', authMiddleware, adminMiddleware, integrationController.getIntegrationDashboard);
router.post('/admin/sync', authMiddleware, adminMiddleware, integrationController.syncIntegrations);
router.put('/admin/property/:propertyId/toggle', authMiddleware, adminMiddleware, integrationController.togglePropertyPublication);
router.put('/admin/settings', authMiddleware, adminMiddleware, integrationController.updateIntegrationSettings);
router.get('/admin/logs', authMiddleware, adminMiddleware, integrationController.getIntegrationLogs);

module.exports = router;
