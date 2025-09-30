import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';
import pool from './db.js';

const app = express();
const PORT = 3002;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = req.body;
    console.log(`[Servidor Pizza] Pedido recebido do frontend.`);
    if (!pedido.itens || pedido.itens.length === 0) {
      return res.status(400).json({ error: "Pedido sem itens" });
    }
    if (!pedido.usuario || !pedido.usuario.nome) {
      return res.status(400).json({ error: "Pedido sem usuário válido" });
    }
    console.log("[Servidor Pizza] Passo 1: Salvando pedido no banco de dados...");

    const clienteIdFixo = '00000000-0000-0000-0000-000000000000';

    const novoPedido = await pool.query(
      'INSERT INTO pedidos (cliente_id, valor_total, status, itens) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        clienteIdFixo,
        pedido.total,
        'Recebido',
        JSON.stringify(pedido.itens) // Converte array pra texto JSON
      ]
    );

    const pedidoSalvoId = novoPedido.rows[0].pedido_id;
    console.log(`[Servidor Pizza] Pedido salvo com sucesso! ID no BD: ${pedidoSalvoId}`);
    
    console.log("[Servidor Pizza] Passo 2: Convertendo produtos para o formato 'caixa'...");
    const caixas = pedido.itens.map(pizza => traduzirPizzaParaCaixinha(pizza));
    
    console.log("[Servidor Pizza] Passo 3: Enviando 'caixas' para a máquina virtual...");
    const promessasDeEnvio = caixas.map(async (caixa, idx) => {
      const payload = {
        payload: {
          orderId: pedidoSalvoId, 
          sku: `KIT-PIZZA-${pedido.itens[idx].tamanho.toUpperCase()}`,
          order: caixa.payload.caixa
        },
        callbackUrl: "http://localhost:3333/callback"
      };
      
      const response = await fetch("http://localhost:3000/queue/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Falha ao enviar para a máquina: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    });
    
    const enviados = await Promise.all(promessasDeEnvio);

    console.log("[Servidor Pizza] Pedido processado com sucesso!");
    res.json({
      message: "Pedido salvo no BD e enviado para produção com sucesso!",
      idsDaMaquina: enviados.map(e => e.id)
    });

  } catch (err) {
    console.error("[Servidor Pizza] ERRO GERAL:", err);
    res.status(500).json({ error: "Erro ao processar o pedido", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🍕 Servidor de Pizzas rodando na porta ${PORT}`);
});

