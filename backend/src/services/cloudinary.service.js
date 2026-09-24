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
 * Faz upload de uma imagem para o Cloudinary.
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} folder - Pasta no Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadImage(fileBuffer, folder = 'elena-imoveis/properties') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Remove uma imagem do Cloudinary.
 * @param {string} publicId - Public ID da imagem
 * @returns {Promise}
 */
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImage, deleteImage, cloudinary, isConfigured };
