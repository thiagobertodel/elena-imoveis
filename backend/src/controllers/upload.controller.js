const multer = require('multer');
const { uploadMedia, deleteMedia, isConfigured } = require('../services/cloudinary.service');
const { query } = require('../database/connection');

// Configuração do Multer — armazena em memória (buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB (para permitir fotos de alta resolução e vídeos)
    files: 65, // Até 60 fotos + vídeos por envio
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mkv'];

    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use imagens (JPEG, PNG, WebP) ou vídeos (MP4, WebM, MOV).'));
    }
  },
});

/**
 * POST /api/v1/upload/:propertyId
 * Upload de imagens e vídeos para um imóvel.
 */
async function uploadImages(req, res) {
  try {
    if (!isConfigured) {
      return res.status(503).json({ error: 'Upload indisponível: configure as credenciais do Cloudinary no .env' });
    }

    const { propertyId } = req.params;

    // Verificar se o imóvel pertence ao usuário
    const property = await query('SELECT user_id, video_url FROM properties WHERE id = $1', [propertyId]);
    if (property.rows.length === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    if (property.rows[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para fazer upload neste imóvel' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Verificar se já existe capa
    const existingImages = await query(
      'SELECT COUNT(*) as total FROM property_images WHERE property_id = $1',
      [propertyId]
    );
    let hasCover = parseInt(existingImages.rows[0].total) > 0;

    const uploadedMedia = [];

    // Processamento em lotes concorrentes (5 por vez) para máxima velocidade sem estourar conexões
    const BATCH_SIZE = 5;
    for (let i = 0; i < req.files.length; i += BATCH_SIZE) {
      const batch = req.files.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex;
          const isVideo = file.mimetype.startsWith('video/');
          const resourceType = isVideo ? 'video' : 'image';

          const result = await uploadMedia(
            file.buffer,
            `elena-imoveis/properties/${propertyId}`,
            resourceType
          );

          // Apenas fotos podem ser capa (a primeira foto caso ainda não haja capa)
          const isCover = !hasCover && !isVideo && globalIndex === 0;
          if (isCover) hasCover = true;

          const dbResult = await query(
            `INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_cover, media_type)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [propertyId, result.url, result.publicId, isCover, resourceType]
          );

          // Se for vídeo e a propriedade ainda não tem video_url gravado, salva como destaque de vídeo
          if (isVideo && !property.rows[0].video_url) {
            await query('UPDATE properties SET video_url = $1 WHERE id = $2', [result.url, propertyId]);
          }

          return dbResult.rows[0];
        })
      );

      uploadedMedia.push(...batchResults);
    }

    return res.status(201).json({
      message: `${uploadedMedia.length} arquivo(s) enviado(s) com sucesso`,
      images: uploadedMedia,
    });
  } catch (err) {
    console.error('Erro no upload:', err);
    return res.status(502).json({ error: 'Não foi possível enviar as mídias ao Cloudinary' });
  }
}

/**
 * DELETE /api/v1/upload/:imageId
 * Remove uma mídia (imagem ou vídeo).
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
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }
    if (image.rows[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para excluir esta mídia' });
    }

    // Remover do Cloudinary (com o resource_type correto)
    if (image.rows[0].cloudinary_public_id) {
      const resourceType = image.rows[0].media_type === 'video' ? 'video' : 'image';
      await deleteMedia(image.rows[0].cloudinary_public_id, resourceType);
    }

    // Se a mídia deletada for o video_url da propriedade, limpa a propriedade
    if (image.rows[0].media_type === 'video') {
      await query(
        'UPDATE properties SET video_url = NULL WHERE id = $1 AND video_url = $2',
        [image.rows[0].property_id, image.rows[0].image_url]
      );
    }

    // Remover do banco
    await query('DELETE FROM property_images WHERE id = $1', [imageId]);

    return res.json({ message: 'Mídia removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover mídia:', err);
    return res.status(500).json({ error: 'Erro ao remover mídia' });
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
