const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'demo' &&
  process.env.CLOUDINARY_API_KEY !== '000000000000000'
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Faz upload de mídia (imagem ou vídeo) para o Cloudinary.
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} folder - Pasta no Cloudinary
 * @param {string} resourceType - 'image' | 'video' | 'auto'
 * @returns {Promise<{url: string, publicId: string, resourceType: string}>}
 */
async function uploadMedia(fileBuffer, folder = 'elena-imoveis/properties', resourceType = 'image') {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
    };

    if (resourceType === 'image') {
      options.transformation = [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Faz upload de uma imagem para o Cloudinary (atalho mantido para compatibilidade).
 */
async function uploadImage(fileBuffer, folder = 'elena-imoveis/properties') {
  return uploadMedia(fileBuffer, folder, 'image');
}

/**
 * Remove mídia do Cloudinary.
 * @param {string} publicId - Public ID da mídia
 * @param {string} resourceType - 'image' | 'video'
 * @returns {Promise}
 */
async function deleteMedia(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Remove uma imagem do Cloudinary (atalho mantido para compatibilidade).
 */
async function deleteImage(publicId) {
  return deleteMedia(publicId, 'image');
}

module.exports = { uploadMedia, uploadImage, deleteMedia, deleteImage, cloudinary, isConfigured };

