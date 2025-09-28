import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = 3000;

app.use(cors({ origin: 'http://localhost:5173' })); // Substitua pelo endereço do frontend
app.use(express.json());

app.post('/api/pedidos', async (req, res) => {
  try {
    const { usuario, itens, data } = req.body;

    const clienteId = '00000000-0000-0000-0000-000000000000'; // Substitua por cliente real depois

    for (const pizza of itens) {
      const ingredientesTexto = pizza.ingredientes
        .map(i => `${i.categoria}: ${i.nome} (x${i.quantidade})`)
        .join(', ');

      await pool.query(
        `INSERT INTO Pizzas (nome, ingredientes, cliente_id, data_pedido)
         VALUES ($1, $2, $3, $4)`,
        [`Pizza ${pizza.tamanho}`, ingredientesTexto, clienteId, data]
      );
    }

    res.status(201).json({ message: 'Pedido salvo com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar pedido' });
  }
});

app.listen(PORT, () => console.log(`Servidor de pizzas rodando na porta ${PORT}`));