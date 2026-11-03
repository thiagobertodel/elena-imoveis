const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { adminMiddleware } = require('../middlewares/admin');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const { upload, uploadImages, removeImage, setCover } = require('../controllers/upload.controller');
const { query } = require('../database/connection');

// Todas as rotas requerem autenticação
router.post('/:propertyId', authMiddleware, adminMiddleware, uploadLimiter, upload.array('images', 65), uploadImages);
router.delete('/:imageId', authMiddleware, adminMiddleware, removeImage);
router.put('/:imageId/cover', authMiddleware, adminMiddleware, setCover);

// Rota para definir ou atualizar URL de vídeo (YouTube, Vimeo, Tour 360)
router.put('/:propertyId/video-link', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { video_url } = req.body;
    await query('UPDATE properties SET video_url = $1, updated_at = NOW() WHERE id = $2', [video_url || null, propertyId]);
    return res.json({ message: 'Vídeo atualizado com sucesso', video_url });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar link de vídeo' });
  }
});

module.exports = router;

