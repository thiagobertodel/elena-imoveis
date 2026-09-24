const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📦 Encontradas ${files.length} migration(s)`);

    for (const file of files) {
      console.log(`🔄 Rodando: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`✅ ${file} executado com sucesso`);
    }

    console.log('\n🎉 Todas as migrations foram executadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao rodar migrations:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
