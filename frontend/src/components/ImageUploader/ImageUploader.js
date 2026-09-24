'use client';
import { useState } from 'react';
import { FaCloudUploadAlt, FaTrash, FaSpinner } from 'react-icons/fa';
import styles from './ImageUploader.module.css';

export default function ImageUploader({ images = [], setImages, files = [], setFiles }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setFiles((prev) => [...prev, ...files]);
    setImages((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
    setUploading(false);
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className={styles.container}>
      <label className={styles.dropzone}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className={styles.fileInput}
        />
        <div className={styles.dropzoneContent}>
          {uploading ? (
            <>
              <FaSpinner className={styles.spinner} />
              <span>Enviando fotos...</span>
            </>
          ) : (
            <>
              <FaCloudUploadAlt className={styles.uploadIcon} />
              <span className={styles.mainText}>Clique ou arraste fotos aqui</span>
              <span className={styles.subText}>Formatos aceitos: JPG, PNG, WEBP (Máx: 5MB cada)</span>
            </>
          )}
        </div>
      </label>

      {images.length > 0 && (
        <div className={styles.previewGrid}>
          {images.map((url, idx) => (
            <div key={idx} className={styles.previewCard}>
              <img src={url} alt={`Prévia ${idx + 1}`} className={styles.previewImage} />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className={styles.deleteBtn}
                title="Remover Imagem"
              >
                <FaTrash />
              </button>
              {idx === 0 && <span className={styles.coverBadge}>Capa</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
