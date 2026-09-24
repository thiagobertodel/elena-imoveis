'use client';
import { useState } from 'react';
import Image from 'next/image';
import { FaExpand, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images = [], title = '' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const galleryImages = images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'];

  const prevImage = () => {
    setActiveIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.container}>
      {/* Main & Thumbnails grid */}
      <div className={styles.grid}>
        <div className={styles.mainWrapper} onClick={() => setModalOpen(true)}>
          <Image
            src={galleryImages[activeIdx]}
            alt={`${title} - Foto ${activeIdx + 1}`}
            fill
            className={styles.mainImage}
            priority
          />
          <button className={styles.expandBtn} aria-label="Expandir foto">
            <FaExpand /> Ver Fotos ({galleryImages.length})
          </button>
        </div>

        <div className={styles.thumbsGrid}>
          {galleryImages.slice(0, 4).map((imgUrl, idx) => (
            <div
              key={idx}
              className={`${styles.thumbWrapper} ${activeIdx === idx ? styles.activeThumb : ''}`}
              onClick={() => setActiveIdx(idx)}
            >
              <Image src={imgUrl} alt={`Thumbnail ${idx + 1}`} fill className={styles.thumbImage} />
              {idx === 3 && galleryImages.length > 4 && (
                <div className={styles.moreOverlay} onClick={() => setModalOpen(true)}>
                  +{galleryImages.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
            <FaTimes />
          </button>

          <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={prevImage}>
            <FaChevronLeft />
          </button>

          <div className={styles.modalImageWrapper}>
            <Image
              src={galleryImages[activeIdx]}
              alt={`${title} - Foto ${activeIdx + 1}`}
              fill
              className={styles.modalImage}
            />
            <span className={styles.counter}>
              {activeIdx + 1} / {galleryImages.length}
            </span>
          </div>

          <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={nextImage}>
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
