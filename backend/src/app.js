require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middlewares/rateLimiter');

// Rotas
const authRoutes = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const integrationRoutes = require('./routes/integration.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// Middlewares globais
// =============================================

// Segurança — headers HTTP (LGPD/Cybersegurança)
app.use(helmet());

// CORS — apenas frontend permitido
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Feed-Token'],
}));

// Rate limiting global
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// =============================================
// Rotas da API
// =============================================

app.get('/', (req, res) => {
  res.json({
    name: 'Elena Imóveis API',
    status: 'online',
    health: '/api/v1/health',
    docs: 'Use /api/v1 para acessar os recursos da API',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/integrations', integrationRoutes); // Atalho direto exigido por integradores


// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// =============================================
// Tratamento de erros
// =============================================

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);

  // Erro do Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo muito grande. Máximo 100MB por arquivo de vídeo ou foto.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Muitos arquivos. Máximo 60 arquivos por lote.' });
  }


  res.status(500).json({ error: 'Erro interno do servidor' });
});

// =============================================
// Iniciar servidor
// =============================================

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║    🏠 Elena Imóveis — API Server          ║
  ║    📡 http://localhost:${PORT}              ║
  ║    🌍 Ambiente: ${process.env.NODE_ENV || 'development'}          ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
