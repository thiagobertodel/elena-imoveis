-- Elena Imóveis — Migration 001: Criar todas as tabelas
-- Rodar com: node src/database/migrate.js

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Tabela de Usuários
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role = 'admin'),
    lgpd_consent BOOLEAN DEFAULT FALSE,
    lgpd_consent_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Tabela de Imóveis
-- =============================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC(12,2) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('venda', 'aluguel')),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('apartamento', 'casa', 'terreno', 'comercial', 'cobertura', 'kitnet')),
    area INTEGER,
    quartos INTEGER DEFAULT 0,
    banheiros INTEGER DEFAULT 0,
    garagem INTEGER DEFAULT 0,
    cidade VARCHAR(100) NOT NULL,
    bairro VARCHAR(100),
    endereco VARCHAR(255),
    cep VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'inativo', 'vendido', 'alugado')),
    destaque BOOLEAN DEFAULT FALSE,
    visualizacoes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Tabela de Imagens dos Imóveis
-- =============================================
CREATE TABLE IF NOT EXISTS property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- Índices para Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_properties_cidade ON properties(cidade);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_tipo ON properties(tipo);
CREATE INDEX IF NOT EXISTS idx_properties_categoria ON properties(categoria);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_preco ON properties(preco);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
