import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pool from './db.js';

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
        if (!pedido.usuario || !pedido.usuario.id) {
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
        
        console.log("\n[PASSO 2/3] 🚀 Enviando para a fila de produção...");
        const promessasDeEnvio = pedido.itens.map(async (item, idx) => {
            const payload = {
                payload: {
                    orderId: pedidoSalvo.pedido_id,
                    sku: `KIT-PIZZA-${item.tamanho.toUpperCase()}`,
                },
                callbackUrl: "http://localhost:3333/callback"
            };
            
            const response = await fetch("http://52.1.197.112:3000/queue/items", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    // Se a criação do pedido precisar de autorização, adicione aqui também
                    // 'Authorization': 'CHAVE_SECRETA_DA_API'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Falha ao enviar item ${idx} para a máquina: ${response.status}`, errorBody);
                throw new Error(`Falha ao enviar para a máquina: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        });
        
        const respostasDaMaquina = await Promise.all(promessasDeEnvio);

        console.log("   ✅ Itens enviados com sucesso para a fila!");

        const idsValidosDaMaquina = respostasDaMaquina
            .filter(resposta => resposta && resposta.id) 
            .map(resposta => resposta.id);

        res.status(201).json({
            message: "Pedido salvo e enviado para produção!",
            pedido: pedidoSalvo,
            idsDaMaquina: idsValidosDaMaquina
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
        console.log(`[HISTÓRICO] Buscando pedidos para o cliente ID: ${clienteId}`);
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
        console.error(`[HISTÓRICO] Erro ao buscar histórico do cliente ${clienteId}:`, err.message);
        res.status(500).json({ error: 'Erro ao buscar histórico de pedidos' });
    }
});


// ROTA PROXY PARA BUSCAR O STATUS DE UM ITEM NA MÁQUINA
app.get('/api/pedidos/status/:machineId', async (req, res) => {
    const { machineId } = req.params;
 
    try {
        console.log(`[PROXY] Consultando status para o ID da máquina: ${machineId}`);
        const responseDaMaquina = await fetch(`http://52.1.197.112:3000/queue/items/${machineId}`, {
            method: 'GET',
            headers: {
                // IMPORTANTE: Substitua pela sua chave de API real!
                'Authorization': 'CHAVE_SECRETA_DA_API' 
            }
        });
 
        if (!responseDaMaquina.ok) {
            throw new Error(`Máquina retornou status: ${responseDaMaquina.status}`);
        }
 
        const statusData = await responseDaMaquina.json();
        res.json(statusData);
 
    } catch (err) {
        console.error(`[PROXY] Erro ao buscar status para o ID ${machineId}:`, err.message);
        res.status(500).json({ error: 'Erro ao consultar o status na máquina', details: err.message });
    }
});


app.listen(PORT, () => {
    console.log(`🍕 Servidor de Pizzas rodando na porta ${PORT}`);
});

