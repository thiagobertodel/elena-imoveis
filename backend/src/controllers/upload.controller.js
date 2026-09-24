const multer = require('multer');
const { uploadImage, deleteImage, isConfigured } = require('../services/cloudinary.service');
const { query } = require('../database/connection');

// Configuração do Multer — armazena em memória (buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10, // Máximo 10 arquivos por vez
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.'));
    }
  },
});

/**
 * POST /api/v1/upload/:propertyId
 * Upload de imagens para um imóvel.
 */
async function uploadImages(req, res) {
  try {
    if (!isConfigured) {
      return res.status(503).json({ error: 'Upload indisponível: configure as credenciais do Cloudinary no .env' });
    }

    const { propertyId } = req.params;

    // Verificar se o imóvel pertence ao usuário
    const property = await query('SELECT user_id FROM properties WHERE id = $1', [propertyId]);
    if (property.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    if (property.rows[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para fazer upload neste imóvel' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    // Verificar se é a primeira imagem (será a cover)
    const existingImages = await query(
      'SELECT COUNT(*) as total FROM property_images WHERE property_id = $1',
      [propertyId]
    );
    const isFirst = parseInt(existingImages.rows[0].total) === 0;

    const uploadedImages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await uploadImage(file.buffer, `elena-imoveis/properties/${propertyId}`);

      const isCover = isFirst && i === 0;

      const dbResult = await query(
        `INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_cover)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [propertyId, result.url, result.publicId, isCover]
      );

      uploadedImages.push(dbResult.rows[0]);
    }

    return res.status(201).json({
      message: `${uploadedImages.length} imagem(ns) enviada(s) com sucesso`,
      images: uploadedImages,
    });
  } catch (err) {
    console.error('Erro no upload:', err);
    return res.status(502).json({ error: 'Não foi possível enviar as imagens ao Cloudinary' });
  }
}

/**
 * DELETE /api/v1/upload/:imageId
 * Remove uma imagem.
 */
async function removeImage(req, res) {
  try {
    const { imageId } = req.params;

    const image = await query(`
      SELECT pi.*, p.user_id FROM property_images pi
      JOIN properties p ON p.id = pi.property_id
      WHERE pi.id = $1
    `, [imageId]);

    if (image.rows.length === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }
    if (image.rows[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para excluir esta imagem' });
    }

    // Remover do Cloudinary
    if (image.rows[0].cloudinary_public_id) {
      await deleteImage(image.rows[0].cloudinary_public_id);
    }

    // Remover do banco
    await query('DELETE FROM property_images WHERE id = $1', [imageId]);

    return res.json({ message: 'Imagem removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover imagem:', err);
    return res.status(500).json({ error: 'Erro ao remover imagem' });
  }
}

/**
 * PUT /api/v1/upload/:imageId/cover
 * Define uma imagem como capa.
 */
async function setCover(req, res) {
  try {
    const { imageId } = req.params;

    const image = await query(`
      SELECT pi.*, p.user_id FROM property_images pi
      JOIN properties p ON p.id = pi.property_id
      WHERE pi.id = $1
    `, [imageId]);

    if (image.rows.length === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }
    if (image.rows[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    // Remover cover atual
    await query(
      'UPDATE property_images SET is_cover = false WHERE property_id = $1',
      [image.rows[0].property_id]
    );

    // Definir nova cover
    await query('UPDATE property_images SET is_cover = true WHERE id = $1', [imageId]);

    return res.json({ message: 'Capa definida com sucesso' });
  } catch (err) {
    console.error('Erro ao definir capa:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { upload, uploadImages, removeImage, setCover };
