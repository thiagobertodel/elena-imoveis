const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { adminMiddleware } = require('../middlewares/admin');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const { upload, uploadImages, removeImage, setCover } = require('../controllers/upload.controller');

// Todas as rotas requerem autenticação
router.post('/:propertyId', authMiddleware, adminMiddleware, uploadLimiter, upload.array('images', 10), uploadImages);
router.delete('/:imageId', authMiddleware, adminMiddleware, removeImage);
router.put('/:imageId/cover', authMiddleware, adminMiddleware, setCover);

module.exports = router;
