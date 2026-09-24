const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middlewares/auth');
const { adminMiddleware } = require('../middlewares/admin');
const { handleValidation } = require('../utils/helpers');
const { propertyValidation, searchValidation, uuidValidation } = require('../utils/validators');
const propertyController = require('../controllers/property.controller');

// Rotas públicas
router.get('/', searchValidation, handleValidation, propertyController.listProperties);
router.get('/featured', propertyController.getFeatured);
router.get('/cities', propertyController.getCities);
router.get('/user/my', authMiddleware, propertyController.getMyProperties);

// Rotas protegidas
router.post('/', authMiddleware, adminMiddleware, propertyValidation, handleValidation, propertyController.createProperty);
router.put('/:id', authMiddleware, adminMiddleware, uuidValidation, handleValidation, propertyController.updateProperty);
router.delete('/:id', authMiddleware, adminMiddleware, uuidValidation, handleValidation, propertyController.deleteProperty);

router.get('/:id', uuidValidation, handleValidation, optionalAuth, propertyController.getProperty);

module.exports = router;
