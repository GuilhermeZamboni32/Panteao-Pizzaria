/////////////  db.js  //////////////
import pg from 'pg';
import 'dotenv/config';

// Cria um "pool" de conexões com o banco de dados.
// Um pool é mais eficiente que criar uma nova conexão para cada consulta.
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME, 
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Mensagem para confirmar que a conexão foi bem-sucedida
pool.on('connect', () => {
  console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
});

// Exporta o pool para que outros arquivos (como o server.js) possam usá-lo
export default pool;
