import pg from 'pg';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const { Pool } = pg;

// Configura o pool de conexões usando a URL do arquivo .env
const configDatabase = {
  connectionString: process.env.DATABASE_URL,
};

// Adiciona configuração SSL para produção (opcional, mas recomendado)
if (process.env.NODE_ENV === 'production') {
  configDatabase.ssl = {
    rejectUnauthorized: false,
  };
}

console.log("Conectando ao banco de dados...");
const pool = new Pool(configDatabase);

pool.on('connect', () => {
  console.log('Cliente conectado ao banco de dados!');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente do banco de dados', err);
  process.exit(-1);
});

export default pool;
