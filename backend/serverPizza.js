// serverPizza.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';

const app = express();
const PORT = 3000;

// --- CORS ---
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Middleware extra para headers (opcional)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Middleware JSON
app.use(express.json());

// --- ROTA DE PEDIDOS ---
app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = req.body;
    console.log("Pedido recebido:", JSON.stringify(pedido, null, 2));

    // Validação simples
    if (!pedido.itens || pedido.itens.length === 0) {
      return res.status(400).json({ error: "Pedido sem itens" });
    }
    if (!pedido.usuario || !pedido.usuario.nome) {
      return res.status(400).json({ error: "Pedido sem usuário válido" });
    }

    // Tradução das pizzas para "caixinhas"
    const caixas = pedido.itens.map(pizza => traduzirPizzaParaCaixinha(pizza));
    console.log("Caixas traduzidas:", JSON.stringify(caixas, null, 2));

    // Enviar cada pizza para a máquina
    const enviados = await Promise.all(
      caixas.map(async (caixa, idx) => {
        const payload = {
          payload: {
            orderId: `${pedido.usuario.nome}-${Date.now()}-${idx}`,
            sku: `KIT-PIZZA-${pedido.itens[idx].tamanho.toUpperCase()}`,
            order: caixa.payload.caixa
          },
          callbackUrl: "http://localhost:3333/callback"
        };

        console.log("Payload enviado:", JSON.stringify(payload, null, 2));

        const response = await fetch("http://52.1.197.112:3000/queue/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Falha ao enviar para a máquina: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      })
    );

    res.json({
      message: "Pedido enviado com sucesso!",
      ids: enviados.map(e => e.id)
    });

  } catch (err) {
    console.error("Erro ao processar pedido:", err);
    res.status(500).json({ error: "Erro ao enviar pedido para a máquina", details: err.message });
  }
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
