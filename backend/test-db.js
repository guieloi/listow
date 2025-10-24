const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Connect to default database first
  user: 'postgres',
  password: 'postgres', // Default password, change if needed
});

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.log('\n📋 Possíveis soluções:');
    console.log('1. Instale o PostgreSQL: https://www.postgresql.org/download/');
    console.log('2. Verifique se o serviço PostgreSQL está rodando');
    console.log('3. Configure a senha do usuário postgres');
    console.log('4. Atualize as configurações em src/config/database.ts');
  }
}

testConnection();
