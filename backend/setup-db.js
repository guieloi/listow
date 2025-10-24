const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Connect to default database first
  user: 'postgres',
  password: 'postgres',
});

async function setupDatabase() {
  try {
    console.log('🔄 Configurando banco de dados...');

    // Create database if it doesn't exist
    console.log('📦 Criando banco de dados listow_db...');
    await pool.query('CREATE DATABASE listow_db');

    // Close connection to default database
    await pool.end();

    // Connect to the new database
    const dbPool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'listow_db',
      user: 'postgres',
      password: 'postgres',
    });

    // Read and execute schema
    console.log('📋 Criando tabelas...');
    const schemaPath = path.join(__dirname, 'database.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await dbPool.query(schema);

    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('📝 Você pode alterar as credenciais no arquivo src/config/database.ts');

    await dbPool.end();
  } catch (error) {
    if (error.code === '42P04') {
      console.log('⚠️  Banco de dados já existe. Pulando criação...');

      // Connect to existing database and run schema
      const dbPool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'listow_db',
        user: 'postgres',
        password: 'postgres',
      });

      try {
        const schemaPath = path.join(__dirname, 'database.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await dbPool.query(schema);
        console.log('✅ Tabelas verificadas/criadas com sucesso!');
        await dbPool.end();
      } catch (schemaError) {
        console.error('❌ Erro ao executar schema:', schemaError.message);
        await dbPool.end();
      }
    } else {
      console.error('❌ Erro ao configurar banco:', error.message);
    }
  }
}

setupDatabase();
