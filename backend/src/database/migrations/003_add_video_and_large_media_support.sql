-- Elena Imóveis — Migration 003: Suporte a vídeo e tipo de mídia
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE property_images ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';
