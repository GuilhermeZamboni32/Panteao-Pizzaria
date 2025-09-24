import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import pool from './db.js';

// --- 1. CONFIGURAÇÃO INICIAL ---
const app = express();
const PORT = process.env.PORT || 3000;

const precos = {
  Broto: 25,
  Média: 30,
  Grande: 45,
};

// --- 2. MIDDLEWARES ---
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- 3. SCHEMAS DE VALIDAÇÃO (ZOD) ---
const ingredienteSchema = z.object({
  sigla: z.string(),
  nome: z.string(),
  categoria: z.string(),
  quantidade: z.number().int().positive(),
});

const itemCarrinhoSchema = z.object({
  id: z.number(),
  tamanho: z.string(),
  molho: z.string(),
  ingredientes: z.array(ingredienteSchema),
});

const pedidoSchema = z.object({
  usuario: z.object({
    nome: z.string(),
    endereco: z.string(),
  }),
  itens: z.array(itemCarrinhoSchema),
  total: z.number(),
});

// --- 4. ROTAS DA API ---
app.post('/api/pedidos', async (req, res) => {
  console.log('Recebido no /api/pedidos:', req.body);

  try {
    const { itens } = pedidoSchema.parse(req.body);
    
    // ========================================================================
    // ATENÇÃO: PONTO CRÍTICO DE ERRO
    // O UUID abaixo PRECISA OBRIGATORIAMENTE existir na sua tabela "Usuario".
    // Se este cliente não existir, o banco de dados rejeitará o pedido
    // com um erro de "foreign key constraint".
    // Rode o INSERT no pgAdmin para garantir que este usuário exista.
    // ========================================================================
    const cliente_id_fixo = 'd17614d9-7246-4e4b-9721-3e34b172b947';

    await pool.query('BEGIN');

    for (const item of itens) {
      const nomePizza = `Pizza ${item.tamanho} ${item.molho.includes('Doce') ? 'Doce' : 'Salgada'}`;
      const precoPizza = precos[item.tamanho] || 0;
      const ingredientesTexto = item.ingredientes
        .map(ing => `${ing.nome} (x${ing.quantidade})`)
        .join(', ');

      const insertPizzaQuery = `
        INSERT INTO "Pizzas" (nome, ingredientes, preco, cliente_id)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(insertPizzaQuery, [nomePizza, ingredientesTexto, precoPizza, cliente_id_fixo]);
    }

    await pool.query('COMMIT');

    res.status(201).json({ message: "Pedido criado com sucesso!", id: cliente_id_fixo });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('ERRO DETALHADO AO PROCESSAR PEDIDO:', error); 
    res.status(500).json({ 
        message: 'Erro interno no servidor ao tentar salvar o pedido.',
        error: error.message, 
        detail: error.detail 
    });
  }
});

// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

