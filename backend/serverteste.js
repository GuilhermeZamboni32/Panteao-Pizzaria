import express from 'express';
import cors from 'cors'; // Importe o CORS

const app = express();
const PORT = 3000;

// --- BANCO DE DADOS EM MEMÓRIA ---
// Em uma aplicação real, você usaria um banco de dados como MongoDB, PostgreSQL, etc.
let pedidos = [];

// --- MIDDLEWARES ---
// 1. Habilita o CORS para permitir que o seu frontend (em outra porta) se comunique com este servidor.
app.use(cors());

// 2. Habilita o servidor a entender requisições com corpo em formato JSON.
app.use(express.json());


// --- ROTAS DA API ---

// Rota para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.send('Servidor da Panteão Pizzaria no ar! 🍕');
});

/**
 * Rota para receber um novo pedido.
 * O frontend envia um objeto de pedido completo.
 */
app.post('/pedidos', (req, res) => {
  console.log('Recebido novo pedido:', req.body);
  
  // Extrai os dados do corpo da requisição
  const { usuario, itens, total } = req.body;

  // --- VALIDAÇÃO BÁSICA ---
  // Verifica se os campos essenciais existem
  if (!usuario || !itens || !total) {
    return res.status(400).json({ error: 'Dados do pedido incompletos. Faltam informações de usuário, itens ou total.' });
  }

  // Verifica se há pelo menos um item no pedido
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'O pedido deve conter pelo menos uma pizza.' });
  }

  // Cria um novo objeto de pedido com um ID e armazena
  const novoPedido = {
    id: pedidos.length + 1, // Gera um ID simples
    ...req.body // Salva todos os dados enviados pelo frontend
  };

  pedidos.push(novoPedido);
  
  console.log('Pedido salvo com sucesso:', novoPedido);

  // Retorna uma resposta de sucesso (201 - Created) com o pedido salvo
  res.status(201).json(novoPedido);
});

/**
 * Rota para listar todos os pedidos já feitos.
 * Útil para debugar e ver o que está salvo.
 */
app.get('/pedidos', (req, res) => {
  res.json(pedidos);
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
