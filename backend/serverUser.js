import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
/** cliente_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
	  endereco VARCHAR(255),
    numero_cartao VARCHAR(20),   
    validade_cartao VARCHAR(7),  
    cvv VARCHAR(4) 


POST /api/users → criar usuário
GET /api/users → listar todos os usuários
GET /api/users/:id → buscar usuário por ID
PUT /api/users/:id → atualizar usuário
DELETE /api/users/:id → deletar usuário*/

// Rota para criar um novo usuário
app.post('/api/users', async (req, res) => {
  const { nome, email, senha, telefone, endereco, numero_cartao, validade_cartao, cvv } = req.body;
  try {
    const newUser = await pool.query(
      'INSERT INTO clientes (nome, email, senha, telefone, endereco, numero_cartao, validade_cartao, cvv) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [nome, email, senha, telefone, endereco, numero_cartao, validade_cartao, cvv]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});


app.get('/api/users/:id', async (req, res) => { 
  const { id } = req.params;
  try {
    const user = await pool.query('SELECT * FROM clientes WHERE cliente_id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

app.get('/api/users', async (req, res) => { 
  try {
    const users = await pool.query('SELECT * FROM clientes');
    res.json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});


app.put('/api/users/:id', async (req, res) => { 
  const { id } = req.params;
  const { nome, email, senha, telefone, endereco, numero_cartao, validade_cartao, cvv } = req.body;
  try {
    const updatedUser = await pool.query(
      'UPDATE clientes SET nome = $1, email = $2, senha = $3, telefone = $4, endereco = $5, numero_cartao = $6, validade_cartao = $7, cvv = $8 WHERE cliente_id = $9 RETURNING *',
      [nome, email, senha, telefone, endereco, numero_cartao, validade_cartao, cvv, id]
    );
    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  } 
});


app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await pool.query('DELETE FROM clientes WHERE cliente_id = $1 RETURNING *', [id]); 
    if (deletedUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
