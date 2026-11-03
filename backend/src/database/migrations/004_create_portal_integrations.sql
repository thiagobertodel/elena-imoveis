-- Elena Imóveis — Migration 004: Tabelas para integração com portais (VRSync - Grupo OLX)

-- 1. Tabela de integrações
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'vrsync',
    enabled BOOLEAN DEFAULT TRUE,
    feed_token VARCHAR(100) UNIQUE NOT NULL,
    feed_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela de publicações dos imóveis por portal
CREATE TABLE IF NOT EXISTS property_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    external_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'aguardando_validacao' CHECK (status IN ('publicado', 'disponivel_no_feed', 'aguardando_validacao', 'erro', 'desativado')),
    eligible BOOLEAN DEFAULT FALSE,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    last_sync_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_property_integration UNIQUE (property_id, integration_id)
);

-- 3. Tabela de logs e auditoria da integração
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_property_pub_property_id ON property_publications(property_id);
CREATE INDEX IF NOT EXISTS idx_property_pub_integration_id ON property_publications(integration_id);
CREATE INDEX IF NOT EXISTS idx_property_pub_status ON property_publications(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at DESC);

-- Inserir registro inicial da integração Grupo OLX se não existir
INSERT INTO integrations (
    id, 
    name, 
    provider, 
    enabled, 
    feed_token, 
    feed_url, 
    settings
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Grupo OLX (ZAP Imóveis e Viva Real)',
    'vrsync',
    TRUE,
    'elena_vrsync_feed_token_secure_2026',
    '/api/v1/integrations/vrsync.xml',
    '{"portals": ["ZAP Imóveis", "Viva Real"], "display_address": "Neighborhood", "publisher_name": "Elena Imóveis", "contact_phone": "(51) 99961-2190", "contact_email": "contato@elenaimoveis.com.br"}'::jsonb
) ON CONFLICT (id) DO NOTHING;
