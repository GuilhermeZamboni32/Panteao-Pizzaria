import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';
import pool from './db.js';

const app = express();
const PORT = 3002;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ROTA ANTIGA - POST para criar um novo pedido (sem alterações)
app.post('/api/pedidos', async (req, res) => {
    // A lógica de estilização de logs que fizemos anteriormente fica aqui
    const pedido = req.body;
    console.log(`\n\n--- 🍕 NOVO PEDIDO RECEBIDO [${new Date().toLocaleTimeString()}] 🍕 ---`);

    try {
        if (!pedido.itens || pedido.itens.length === 0) {
            return res.status(400).json({ error: "Pedido sem itens" });
        }
        if (!pedido.usuario || !pedido.usuario.nome) {
            return res.status(400).json({ error: "Pedido sem usuário válido" });
        }
        
        console.log("\n[PASSO 1/3] 💾 Salvando no banco de dados...");
        // Usando o ID do usuário real que veio do frontend
        const clienteId = pedido.usuario.id || '00000000-0000-0000-0000-000000000000';

        const novoPedido = await pool.query(
            'INSERT INTO pedidos (cliente_id, valor_total, status, itens) VALUES ($1, $2, $3, $4) RETURNING *',
            [
                clienteId,
                pedido.total,
                'Recebido',
                JSON.stringify(pedido.itens)
            ]
        );
        const pedidoSalvoId = novoPedido.rows[0].pedido_id;
        console.log(`  ✅ Pedido salvo com sucesso! (ID: ${pedidoSalvoId})`);
        
        console.log(`\n[ID do Pedido: ${pedidoSalvoId}]`);
        console.log("\n[PASSO 2/3] 🔄 Convertendo para o formato da máquina...");
        
        const caixas = pedido.itens.map(pizza => traduzirPizzaParaCaixinha(pizza));
        
        console.log("\n[PASSO 3/3] 🚀 Enviando para a fila de produção...");
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
        
        await Promise.all(promessasDeEnvio);

        console.log("  ✅ Pedido enviado com sucesso!");
        res.json({
            message: "Pedido salvo no BD e enviado para produção com sucesso!",
            idsDaMaquina: (await Promise.all(promessasDeEnvio)).map(e => e.id)
        });

    } catch (err) {
        console.error("\n❌ ERRO GERAL AO PROCESSAR PEDIDO:", err);
        console.error("  ❗ O erro ocorreu com este pedido:", JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: "Erro ao processar o pedido", details: err.message });
    
    } finally {
        console.log("\n--- ✅ PROCESSAMENTO CONCLUÍDO ✅ ---\n");
    }
});


// NOVA ROTA - GET para buscar o histórico de pedidos de um cliente
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
  const { clienteId } = req.params;
  try {
    console.log(`[Servidor Pizza] Buscando histórico para o cliente ID: ${clienteId}`);
    const resultado = await pool.query(
      'SELECT * FROM pedidos WHERE cliente_id = $1 ORDER BY data_pedido DESC', 
      [clienteId]
    );

    // O campo 'itens' vem como texto do banco, então convertemos de volta para JSON
    const pedidos = resultado.rows.map(pedido => {
        return {
            ...pedido,
            itens: typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : pedido.itens
        };
    });
    
    res.json(pedidos);

  } catch (err) {
    console.error(`Erro ao buscar histórico do cliente ${clienteId}:`, err.message);
    res.status(500).json({ error: 'Erro ao buscar histórico de pedidos' });
  }
});


app.listen(PORT, () => {
  console.log(`🍕 Servidor de Pizzas rodando na porta ${PORT}`);
});
