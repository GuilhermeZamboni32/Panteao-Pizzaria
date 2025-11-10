
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import  pool  from '../serviceDatabase/db.js';
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

        // Remove a senha do objeto antes de enviar a resposta
        const { senha: _, ...dadosDoUsuario } = user;
        res.status(200).json(dadosDoUsuario);

    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// ROTA PARA CRIAR UM NOVO USUÁRIO (CADASTRO) - CORRIGIDA
app.post('/api/users', async (req, res) => {
    // Agora só aceita os campos que REALMENTE existem na tabela 'clientes'
    const { nome, email, senha, telefone } = req.body; 

    // Validação simples
    if (!nome || !email || !senha || !telefone) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        
        const newUserResult = await pool.query(
            // Query corrigida para a nova tabela 'clientes'
            'INSERT INTO clientes (nome, email, senha, telefone) VALUES ($1, $2, $3, $4) RETURNING *',
            [nome, email, hashedPassword, telefone]
        );
        
        const { senha: _, ...novoUsuario } = newUserResult.rows[0];
        res.status(201).json(novoUsuario);
        
    } catch (err) {
        console.error('Erro ao criar usuário:', err.message);
        if (err.code === '23505') { 
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
});

// --- ROTAS CRUD PARA GERENCIAMENTO DE USUÁRIOS ---

// ROTA PARA LISTAR TODOS OS USUÁRIOS (sem dados sensíveis)
app.get('/api/users', async (req, res) => { 
    try {
        const users = await pool.query('SELECT cliente_id, nome, email, telefone, endereco FROM clientes ORDER BY nome ASC');
        res.json(users.rows);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err.message);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// ROTA PARA BUSCAR UM USUÁRIO POR ID (sem dados sensíveis)
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
    // Apenas alguns campos podem ser atualizados para segurança
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

// --- ROTA PARA ALTERAR SENHA ---
app.put('/api/users/password/:id', async (req, res) => {
    const { id } = req.params; // Isto vai receber o 'cliente_id' do frontend
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        // 1. Buscar o usuário e sua senha atual no banco
        const userResult = await pool.query('SELECT * FROM clientes WHERE cliente_id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const user = userResult.rows[0];

        // 2. Comparar a senha atual enviada com a senha no banco
        const senhaValida = await bcrypt.compare(senhaAtual, user.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'A senha atual está incorreta.' });
        }

        // 3. Se a senha atual estiver correta, criar o hash da nova senha
        const hashedNovaSenha = await bcrypt.hash(novaSenha, 10);

        // 4. Atualizar o banco com a nova senha
        await pool.query(
            'UPDATE clientes SET senha = $1 WHERE cliente_id = $2',
            [hashedNovaSenha, id]
        );

        res.status(200).json({ message: 'Senha alterada com sucesso!' });

    } catch (err) {
        console.error('Erro ao alterar senha:', err.message);
        res.status(500).json({ error: 'Erro interno ao alterar a senha.' });
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
        res.status(500).json({ error: 'Erro ao deletar usuário.' });
    }
});

// ==========================================================
// ROTAS DE ENDEREÇOS (para Minha Conta)
// ==========================================================

// GET (Buscar todos os endereços de um cliente)
app.get('/api/enderecos/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM enderecos WHERE cliente_id = $1 ORDER BY rua ASC', [clienteId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar endereços:', err.message);
        res.status(500).json({ error: 'Erro ao buscar endereços.' });
    }
});

// POST (Criar um novo endereço)
app.post('/api/enderecos', async (req, res) => {
    // 'usuario_id' é o alias para 'cliente_id' vindo do frontend
    const { rua, numero, bairro, cep, complemento, usuario_id } = req.body; 
    try {
        const newEndereco = await pool.query(
            'INSERT INTO enderecos (cliente_id, rua, numero, bairro, cep, complemento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [usuario_id, rua, numero, bairro, cep, complemento]
        );
        res.status(201).json(newEndereco.rows[0]);
    } catch (err) {
        console.error('Erro ao criar endereço:', err.message);
        res.status(500).json({ error: 'Erro ao criar endereço.' });
    }
});

// PUT (Atualizar um endereço)
app.put('/api/enderecos/:id', async (req, res) => {
    const { id } = req.params;
    const { rua, numero, bairro, cep, complemento } = req.body;
    try {
        const updatedEndereco = await pool.query(
            'UPDATE enderecos SET rua = $1, numero = $2, bairro = $3, cep = $4, complemento = $5 WHERE endereco_id = $6 RETURNING *',
            [rua, numero, bairro, cep, complemento, id]
        );
        if (updatedEndereco.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }
        res.json(updatedEndereco.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar endereço:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar endereço.' });
    }
});

// DELETE (Remover um endereço)
app.delete('/api/enderecos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await pool.query('DELETE FROM enderecos WHERE endereco_id = $1 RETURNING endereco_id', [id]);
        if (deleted.rowCount === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado.' });
        }
        res.status(200).json({ message: 'Endereço removido com sucesso.' });
    } catch (err) {
        console.error('Erro ao remover endereço:', err.message);
        res.status(500).json({ error: 'Erro ao remover endereço.' });
    }
});


// ==========================================================
// ROTAS DE PAGAMENTOS (para Minha Conta)
// ==========================================================

// GET (Buscar todos os cartões de um cliente)
app.get('/api/pagamentos/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    try {
        // Seleciona os dados seguros da tabela
        const result = await pool.query(
            'SELECT cartao_id, bandeira, ultimos_4_digitos, validade_cartao FROM cartoes_salvos WHERE cliente_id = $1', 
            [clienteId]
        );
        
        // Renomeia as colunas para bater com o frontend (brand, last4, validade, id)
        const cartoesFormatados = result.rows.map(cartao => ({
            id: cartao.cartao_id,
            brand: cartao.bandeira,
            last4: cartao.ultimos_4_digitos,
            validade: cartao.validade_cartao
        }));

        res.json(cartoesFormatados);
    } catch (err) {
        console.error('Erro ao buscar cartões:', err.message);
        res.status(500).json({ error: 'Erro ao buscar cartões.' });
    }
});

// POST (Adicionar um novo cartão)
app.post('/api/pagamentos', async (req, res) => {
    const { nome_titular, numero_cartao, validade, cvv, usuario_id } = req.body;

    // --- SIMULAÇÃO DE TOKENIZAÇÃO (NUNCA SALVE O CVV OU NÚMERO COMPLETO) ---
    // 1. Detecta a bandeira (simulação)
    let bandeira = 'Cartão';
    if (numero_cartao.startsWith('4')) {
        bandeira = 'Visa';
    } else if (numero_cartao.startsWith('5')) {
        bandeira = 'Mastercard';
    }
    
    // 2. Pega os últimos 4 dígitos
    const ultimos_4_digitos = numero_cartao.slice(-4);
    
    // 3. Simula um token de gateway
    const gateway_token = 'tok_' + Math.random().toString(36).substr(2, 10);
    
    // 4. Pega a validade
    const validade_cartao = validade; // MM/AA
    // ------------------------------------------------------------------

    try {
        const newCartao = await pool.query(
            'INSERT INTO cartoes_salvos (cliente_id, gateway_token, bandeira, ultimos_4_digitos, validade_cartao) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [usuario_id, gateway_token, bandeira, ultimos_4_digitos, validade_cartao]
        );
        res.status(201).json(newCartao.rows[0]);
    } catch (err) {
        console.error('Erro ao salvar cartão:', err.message);
        res.status(500).json({ error: 'Erro ao salvar cartão.' });
    }
});

// DELETE (Remover um cartão)
app.delete('/api/pagamentos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await pool.query('DELETE FROM cartoes_salvos WHERE cartao_id = $1 RETURNING cartao_id', [id]);
        if (deleted.rowCount === 0) {
            return res.status(404).json({ error: 'Cartão não encontrado.' });
        }
        res.status(200).json({ message: 'Cartão removido com sucesso.' });
    } catch (err) {
        console.error('Erro ao remover cartão:', err.message);
        res.status(500).json({ error: 'Erro ao remover cartão.' });
    }
});


app.listen(PORT, () => console.log(`Servidor de usuários rodando na porta ${PORT}`));
