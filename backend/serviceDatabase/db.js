/////////////  db.js  //////////////
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME, 
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


pool.on('connect', () => {
  console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
});


export default pool;
