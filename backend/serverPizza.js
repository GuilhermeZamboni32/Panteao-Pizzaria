import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pool from './db.js';

// Não é necessário importar 'traduzirPizzaParaCaixinha.js' aqui,
// a menos que este arquivo também o utilize.
// Se ele for usado apenas por outro servidor, pode remover a linha.

const app = express();
const PORT = 3002;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ROTA PARA CRIAR UM NOVO PEDIDO
app.post('/api/pedidos', async (req, res) => {
    const pedido = req.body;
    console.log(`\n\n--- 🍕 NOVO PEDIDO RECEBIDO [${new Date().toLocaleTimeString()}] 🍕 ---`);

    try {
        if (!pedido.itens || pedido.itens.length === 0) {
            return res.status(400).json({ error: "Pedido sem itens" });
        }
        if (!pedido.usuario || !pedido.usuario.id) { // Verificando pelo ID do usuário
            return res.status(400).json({ error: "Pedido sem usuário válido" });
        }
        
        console.log("\n[PASSO 1/3] 💾 Salvando no banco de dados...");
        const clienteId = pedido.usuario.id;

        const novoPedido = await pool.query(
            'INSERT INTO pedidos (cliente_id, valor_total, status, itens) VALUES ($1, $2, $3, $4) RETURNING *',
            [
                clienteId,
                pedido.total,
                'Recebido',
                JSON.stringify(pedido.itens)
            ]
        );
        const pedidoSalvo = novoPedido.rows[0];
        console.log(`   ✅ Pedido salvo com sucesso! (ID no BD: ${pedidoSalvo.pedido_id})`);
        
        // A função de tradução deve estar disponível aqui se for usada
        // const caixas = pedido.itens.map(pizza => traduzirPizzaParaCaixinha(pizza));
        
        console.log("\n[PASSO 2/3] 🚀 Enviando para a fila de produção...");
        // Simulando o envio para a máquina, já que a tradução foi removida do escopo
        const promessasDeEnvio = pedido.itens.map(async (item, idx) => {
            const payload = {
                payload: {
                    orderId: pedidoSalvo.pedido_id, // Usando o ID do pedido do nosso BD
                    sku: `KIT-PIZZA-${item.tamanho.toUpperCase()}`,
                    // order: caixa.payload.caixa // A lógica de tradução seria necessária aqui
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
        
        const respostasDaMaquina = await Promise.all(promessasDeEnvio);

        console.log("  ✅ Itens enviados com sucesso para a fila!");
        res.status(201).json({
            message: "Pedido salvo e enviado para produção!",
            pedido: pedidoSalvo,
            idsDaMaquina: respostasDaMaquina.map(e => e.id)
        });

    } catch (err) {
        console.error("\n❌ ERRO GERAL AO PROCESSAR PEDIDO:", err);
        console.error("  ❗ O erro ocorreu com este pedido:", JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: "Erro ao processar o pedido", details: err.message });
    
    } finally {
        console.log("\n--- ✅ PROCESSAMENTO CONCLUÍDO ✅ ---\n");
    }
});

// ROTA PARA BUSCAR O HISTÓRICO DE PEDIDOS DE UM CLIENTE
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
  const { clienteId } = req.params;
  try {
    console.log(`[Servidor Pizza] Buscando histórico para o cliente ID: ${clienteId}`);
    const resultado = await pool.query(
      'SELECT * FROM pedidos WHERE cliente_id = $1 ORDER BY data_pedido DESC', 
      [clienteId]
    );

    const pedidos = resultado.rows.map(pedido => ({
        ...pedido,
        itens: typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : pedido.itens
    }));
    
    res.json(pedidos);

  } catch (err) {
    console.error(`Erro ao buscar histórico do cliente ${clienteId}:`, err.message);
    res.status(500).json({ error: 'Erro ao buscar histórico de pedidos' });
  }
});

// ROTA PROXY PARA BUSCAR O STATUS DE UM ITEM NA MÁQUINA
app.get('/api/pedidos/status/:machineId', async (req, res) => {
  const { machineId } = req.params;

  try {
    console.log(`[Proxy] Consultando status para o ID da máquina: ${machineId}`);
    const responseDaMaquina = await fetch(`http://localhost:3000/queue/items/${machineId}`);

    if (!responseDaMaquina.ok) {
      throw new Error(`Máquina retornou status: ${responseDaMaquina.status}`);
    }

    const statusData = await responseDaMaquina.json();
    res.json(statusData);

  } catch (err) {
    console.error(`[Proxy] Erro ao buscar status para o ID ${machineId}:`, err.message);
    res.status(500).json({ error: 'Erro ao consultar o status na máquina', details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`🍕 Servidor de Pizzas rodando na porta ${PORT}`);
});
