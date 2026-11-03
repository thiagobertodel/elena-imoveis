'use client';
import { useState } from 'react';
import { 
  FaCloudUploadAlt, FaTrash, FaSpinner, FaVideo, 
  FaImages, FaStar, FaYoutube, FaLink, FaCheckCircle, FaExclamationTriangle 
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './ImageUploader.module.css';

const MAX_IMAGES = 60;
const MAX_IMAGE_SIZE_MB = 15; // 15MB por foto
const MAX_VIDEO_SIZE_MB = 100; // 100MB para vídeo

export default function ImageUploader({ 
  images = [], 
  setImages, 
  files = [], 
  setFiles,
  videoFile = null,
  setVideoFile,
  videoUrl = '',
  setVideoUrl,
  uploadProgress = null
}) {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'video'
  const [videoMode, setVideoMode] = useState('file'); // 'file' | 'link'
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

  // Manipulador de adição de fotos (até 60)
  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Verificar se ultrapassa o limite de 60 fotos
    const currentCount = files.length;
    const availableSlots = MAX_IMAGES - currentCount;

    if (availableSlots <= 0) {
      toast.error(`Limite máximo de ${MAX_IMAGES} fotos já foi atingido.`);
      return;
    }

    let filesToAdd = selectedFiles;
    if (selectedFiles.length > availableSlots) {
      toast.error(`Você selecionou ${selectedFiles.length} fotos, mas restavam apenas ${availableSlots} vagas. Adicionando as primeiras ${availableSlots}.`);
      filesToAdd = selectedFiles.slice(0, availableSlots);
    }

    // Validar tamanho e tipo
    const validFiles = [];
    const validPreviews = [];

    for (const file of filesToAdd) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`A imagem "${file.name}" ultrapassa o limite de ${MAX_IMAGE_SIZE_MB}MB.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setImages((prev) => [...prev, ...validPreviews]);
      toast.success(`${validFiles.length} foto(s) adicionada(s)! Total: ${currentCount + validFiles.length}/${MAX_IMAGES}`);
    }

    // Resetar o input
    e.target.value = '';
  };

  // Remover foto específica
  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Definir foto como capa (move para o índice 0)
  const makeCover = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    setFiles((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    toast.success('Foto definida como capa principal!');
  };

  // Limpar todas as fotos
  const clearAllImages = () => {
    if (!window.confirm('Tem certeza que deseja remover todas as fotos selecionadas?')) return;
    setImages([]);
    setFiles([]);
  };

  // Manipulador de upload de vídeo
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`O vídeo ultrapassa o limite máximo de ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione um arquivo de vídeo válido (.mp4, .mov, .webm).');
      return;
    }

    const preview = URL.createObjectURL(file);
    setVideoPreviewUrl(preview);
    if (setVideoFile) setVideoFile(file);
    toast.success(`Vídeo "${file.name}" carregado com sucesso!`);
    e.target.value = '';
  };

  const removeVideoFile = () => {
    setVideoPreviewUrl(null);
    if (setVideoFile) setVideoFile(null);
  };

  // Extrair ID do YouTube se aplicável para preview
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className={styles.container}>
      {/* Abas superiores: Fotos e Vídeos */}
      <div className={styles.tabsHeader}>
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`${styles.tabBtn} ${activeTab === 'photos' ? styles.tabBtnActive : ''}`}
        >
          <FaImages /> Fotos do Imóvel ({images.length}/{MAX_IMAGES})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`${styles.tabBtn} ${activeTab === 'video' ? styles.tabBtnActive : ''}`}
        >
          <FaVideo /> Vídeo / Tour Virtual {videoFile || videoUrl ? '✅' : ''}
        </button>
      </div>

      {/* Barra de progresso de upload se estiver enviando */}
      {uploadProgress !== null && (
        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span>Enviando mídias para o servidor...</span>
            <span className={styles.progressPercent}>{uploadProgress}%</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }} 
            />
          </div>
        </div>
      )}

      {/* ABA 1: FOTOS */}
      {activeTab === 'photos' && (
        <div className={styles.sectionBody}>
          <div className={styles.headerInfo}>
            <div>
              <h4 className={styles.sectionHeading}>Galeria de Fotos</h4>
              <p className={styles.sectionSubHeading}>
                Envie até <strong>{MAX_IMAGES} fotos</strong> em alta resolução. A primeira foto com a tag <strong>CAPA</strong> será o destaque nos resultados de busca.
              </p>
            </div>
            <div className={styles.counterBadge}>
              <span className={styles.counterNum}>{images.length}</span> / {MAX_IMAGES} fotos
            </div>
          </div>

          {/* Dropzone de fotos */}
          {images.length < MAX_IMAGES ? (
            <label className={styles.dropzone}>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handlePhotoChange}
                className={styles.fileInput}
              />
              <div className={styles.dropzoneContent}>
                <FaCloudUploadAlt className={styles.uploadIcon} />
                <span className={styles.mainText}>Clique ou arraste até {MAX_IMAGES - images.length} fotos aqui</span>
                <span className={styles.subText}>
                  Formatos aceitos: JPG, PNG, WEBP, AVIF (Máx: {MAX_IMAGE_SIZE_MB}MB cada). Suporte a seleção múltipla.
                </span>
                <span className={styles.highlightBadge}>
                  Suporta upload em massa de até 60 fotos
                </span>
              </div>
            </label>
          ) : (
            <div className={styles.limitReachedBox}>
              <FaCheckCircle className={styles.successIcon} />
              <span>Você atingiu o limite máximo de {MAX_IMAGES} fotos para este anúncio!</span>
            </div>
          )}

          {/* Barra de ações da galeria */}
          {images.length > 0 && (
            <div className={styles.galleryActions}>
              <span className={styles.dragHint}>
                💡 Dica: Clique no botão com estrela de qualquer foto para torná-la a <strong>CAPA</strong>.
              </span>
              <button 
                type="button" 
                onClick={clearAllImages} 
                className={styles.clearAllBtn}
              >
                <FaTrash /> Limpar Todas ({images.length})
              </button>
            </div>
          )}

          {/* Grade de miniaturas */}
          {images.length > 0 && (
            <div className={styles.previewGrid}>
              {images.map((url, idx) => (
                <div key={idx} className={`${styles.previewCard} ${idx === 0 ? styles.coverCard : ''}`}>
                  <img src={url} alt={`Foto ${idx + 1}`} className={styles.previewImage} />
                  
                  <div className={styles.cardOverlay}>
                    {idx === 0 ? (
                      <span className={styles.coverBadge}><FaStar /> Capa Principal</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeCover(idx)}
                        className={styles.setCoverBtn}
                        title="Definir esta foto como Capa Principal"
                      >
                        <FaStar /> Tornar Capa
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className={styles.deleteBtn}
                      title="Remover foto"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <span className={styles.photoIndexBadge}>#{idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: VÍDEO / TOUR VIRTUAL */}
      {activeTab === 'video' && (
        <div className={styles.sectionBody}>
          <div className={styles.headerInfo}>
            <div>
              <h4 className={styles.sectionHeading}>Vídeo ou Tour Virtual do Imóvel</h4>
              <p className={styles.sectionSubHeading}>
                Imóveis com vídeo têm até 300% mais engajamento. Você pode fazer o upload de um arquivo de vídeo direto ou adicionar um link do YouTube/Vimeo.
              </p>
            </div>
          </div>

          {/* Seleção do modo de vídeo */}
          <div className={styles.videoModeSelector}>
            <button
              type="button"
              onClick={() => setVideoMode('file')}
              className={`${styles.modeBtn} ${videoMode === 'file' ? styles.modeBtnActive : ''}`}
            >
              <FaCloudUploadAlt /> Enviar Arquivo de Vídeo (.MP4 / .MOV)
            </button>
            <button
              type="button"
              onClick={() => setVideoMode('link')}
              className={`${styles.modeBtn} ${videoMode === 'link' ? styles.modeBtnActive : ''}`}
            >
              <FaYoutube /> Link do YouTube / Vimeo
            </button>
          </div>

          {/* MODO ARQUIVO DE VÍDEO */}
          {videoMode === 'file' && (
            <div className={styles.videoFileArea}>
              {!videoFile && !videoPreviewUrl ? (
                <label className={styles.videoDropzone}>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    onChange={handleVideoFileChange}
                    className={styles.fileInput}
                  />
                  <div className={styles.dropzoneContent}>
                    <FaVideo className={styles.uploadIcon} />
                    <span className={styles.mainText}>Selecione um arquivo de vídeo do imóvel</span>
                    <span className={styles.subText}>
                      Formatos recomendados: MP4, MOV, WebM (Tamanho máximo: {MAX_VIDEO_SIZE_MB}MB)
                    </span>
                    <span className={styles.videoBadge}>O vídeo será exibido na página de detalhes do imóvel</span>
                  </div>
                </label>
              ) : (
                <div className={styles.videoPreviewContainer}>
                  <div className={styles.videoPlayerBox}>
                    <video 
                      src={videoPreviewUrl} 
                      controls 
                      className={styles.videoPlayer}
                    />
                  </div>
                  <div className={styles.videoMeta}>
                    <div>
                      <h5 className={styles.videoFileName}>
                        <FaVideo /> {videoFile?.name || 'Vídeo anexado'}
                      </h5>
                      <span className={styles.videoFileSize}>
                        {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Vídeo pronto'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeVideoFile}
                      className={styles.removeVideoBtn}
                    >
                      <FaTrash /> Remover Vídeo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO LINK DE VÍDEO (YOUTUBE / VIMEO) */}
          {videoMode === 'link' && (
            <div className={styles.videoLinkArea}>
              <div className={styles.linkInputGroup}>
                <label className={styles.inputLabel}>
                  <FaLink /> URL do Vídeo (YouTube, Vimeo ou Tour 360)
                </label>
                <div className={styles.inputWithIcon}>
                  <input
                    type="url"
                    placeholder="Ex: https://www.youtube.com/watch?v=..."
                    value={videoUrl || ''}
                    onChange={(e) => setVideoUrl && setVideoUrl(e.target.value)}
                    className={styles.textInput}
                  />
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setVideoUrl && setVideoUrl('')}
                      className={styles.clearInputBtn}
                      title="Limpar URL"
                    >
                      ×
                    </button>
                  )}
                </div>
                <span className={styles.inputHelper}>
                  Cole o link completo do vídeo. Exemplo: <code>https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
                </span>
              </div>

              {/* Preview do YouTube se válido */}
              {youtubeEmbedUrl && (
                <div className={styles.embedPreview}>
                  <h6 className={styles.previewTitle}>Pré-visualização do Vídeo:</h6>
                  <div className={styles.embedWrapper}>
                    <iframe
                      src={youtubeEmbedUrl}
                      title="Pré-visualização do Vídeo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={styles.iframe}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
