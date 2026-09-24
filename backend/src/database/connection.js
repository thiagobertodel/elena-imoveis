const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'elena_imoveis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool do PostgreSQL:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

/**
 * Executa uma query parametrizada.
 * @param {string} text - SQL query
 * @param {Array} params - Parâmetros da query
 * @returns {Promise} Resultado da query
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtém um client do pool para transações.
 * @returns {Promise} Client do pool
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
