// IMPORTANTE: Adicione esta linha no TOPO do arquivo para carregar as variáveis de ambiente
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import pool from './db.js';
import bcrypt from 'bcryptjs';


const app = express();
// Usa a porta do ambiente ou 3001 como padrão
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json());

// --- ROTAS DE AUTENTICAÇÃO ---

// ROTA DE LOGIN 
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = userResult.rows[0];
      
        const senhaValida = await bcrypt.compare(senha, user.senha); 

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const { senha: _, ...dadosDoUsuario } = user;
        res.status(200).json(dadosDoUsuario);

    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

//  ROTA DE CADASTRO 
app.post('/api/users', async (req, res) => {
    const { nome, email, senha, telefone, endereco } = req.body;
    try {
        // Validação simples de campos
        if (!nome || !email || !senha || !telefone || !endereco) {
             return res.status(400).json({ error: "Todos os campos (nome, email, senha, telefone, endereço) são obrigatórios." });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        const newUserResult = await pool.query(
            'INSERT INTO clientes (nome, email, senha, telefone, endereco) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, email, hashedPassword, telefone, endereco] // 4. Passa apenas os parâmetros corretos
        );
        
        const { senha: _, ...novoUsuario } = newUserResult.rows[0];
        res.status(201).json(novoUsuario);
    } catch (err) {
        console.error('Erro ao criar usuário:', err.message);
        if (err.code === '23505') { // Trata erro de email duplicado
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }
        // O erro "Illegal arguments" deve desaparecer agora
        res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
});
 



// ROTA PARA LISTAR TODOS OS USUÁRIOS
app.get('/api/users', async (req, res) => { 
    try {
        const users = await pool.query('SELECT cliente_id, nome, email, telefone, endereco FROM clientes ORDER BY nome ASC');
        res.json(users.rows);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err.message);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// ROTA PARA BUSCAR UM USUÁRIO POR ID
app.get('/api/users/:id', async (req, res) => { 
    const { id } = req.params;
    try {
        const userResult = await pool.query('SELECT cliente_id, nome, email, telefone, endereco FROM clientes WHERE cliente_id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.json(userResult.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar usuário:', err.message);
        res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
});

// ROTA PARA ATUALIZAR UM USUÁRIO POR ID
app.put('/api/users/:id', async (req, res) => { 
    const { id } = req.params;
    const { nome, telefone, endereco } = req.body;
    try {
        const updatedUserResult = await pool.query(
            'UPDATE clientes SET nome = $1, telefone = $2, endereco = $3 WHERE cliente_id = $4 RETURNING *',
            [nome, telefone, endereco, id]
        );
        if (updatedUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para atualizar.' });
        }
        
        const { senha: _, ...usuarioAtualizado } = updatedUserResult.rows[0];
        res.json(usuarioAtualizado);
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    } 
});

// ROTA PARA DELETAR UM USUÁRIO POR ID
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedUser = await pool.query('DELETE FROM clientes WHERE cliente_id = $1 RETURNING cliente_id, nome', [id]); 
        if (deletedUser.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para deletar.' });
        }
        res.status(200).json({ message: `Usuário '${deletedUser.rows[0].nome}' deletado com sucesso.` });
    } catch (err) {
        console.error('Erro ao deletar usuário:', err.message);
        if (err.code === '23503') {
             return res.status(409).json({ error: 'Não é possível deletar este usuário pois ele possui pedidos no histórico.' });
        }
        res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }
});


app.listen(PORT, () => console.log(`Servidor de usuários rodando na porta ${PORT}`));
