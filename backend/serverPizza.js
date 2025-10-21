//serverPizza.js

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pool from './db.js';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';

const app = express();
const PORT = 3002;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());


// ROTA PARA CRIAR UM NOVO PEDIDO 
app.post('/api/pedidos', async (req, res) => {
    const pedido = req.body;
    const client = await pool.connect();

    console.log(`\n\n--- 🍕 NOVO PEDIDO RECEBIDO [${new Date().toLocaleTimeString()}] 🍕 ---`);

    try {
        if (!pedido.itens || pedido.itens.length === 0) {
            return res.status(400).json({ error: "Pedido sem itens" });
        }
        if (!pedido.usuario || !pedido.usuario.id) {
            return res.status(400).json({ error: "Pedido sem usuário válido" });
        }
        
        await client.query('BEGIN');
        console.log("\n[PASSO 1/4] 💾 Iniciando transação no banco de dados...");

        console.log("[PASSO 2/4] 💾 Inserindo o registro principal do pedido...");
        const clienteId = pedido.usuario.id;
        const pedidoQuery = `INSERT INTO pedidos (cliente_id, valor_total, status) VALUES ($1, $2, $3) RETURNING *`;
        const novoPedidoResult = await client.query(pedidoQuery, [clienteId, pedido.total, 'Recebido']);
        const pedidoSalvo = novoPedidoResult.rows[0];
        console.log(`   ✅ Pedido principal salvo com sucesso! (ID no BD: ${pedidoSalvo.pedido_id})`);

        console.log("[PASSO 3/4] 💾 Inserindo os itens do pedido...");
        const itemInsertPromises = pedido.itens.map(item => {
            const nomeDoItem = `Pizza ${item.tamanho} (${item.ingredientes.map(i => i.nome).join(', ')})`;
            const valorUnitario = pedido.total / pedido.itens.length;
            const itemQuery = `INSERT INTO itens_pedido (pedido_id, nome_item, quantidade, valor_unitario) VALUES ($1, $2, $3, $4)`;
            return client.query(itemQuery, [pedidoSalvo.pedido_id, nomeDoItem, 1, valorUnitario]);
        });
        await Promise.all(itemInsertPromises);
        console.log(`   ✅ ${pedido.itens.length} itens salvos com sucesso!`);
        
        // [PASSO 4/4] 🚀 Enviando para a fila de produção...
console.log("\n[PASSO 4/4] 🚀 Enviando para a fila de produção...");
const promessasDeEnvio = pedido.itens.map(async (item) => {
    
    // --- MUDANÇA PRINCIPAL AQUI ---
    // 1. Chama a função de tradução para o item atual (pizza).
    console.log(`   Traduzindo item (Pizza ${item.tamanho})...`);
    const payloadTraduzido = traduzirPizzaParaCaixinha(item);

    // 2. IMPORTANTE: Sobrescreve o orderId temporário da função de tradução
    //    pelo ID real que acabamos de salvar no banco de dados.
    //    Isso garante a consistência entre os sistemas.
    payloadTraduzido.payload.orderId = pedidoSalvo.pedido_id;

    console.log(`   Enviando payload traduzido para a máquina...`);
    const response = await fetch("http://52.1.197.112:3000/queue/items", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            // Se a API da máquina exigir autorização, adicione aqui
            // 'Authorization': 'SUA_CHAVE_DE_API'
        },
        body: JSON.stringify(payloadTraduzido) // 3. Usa o payload traduzido!
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`   ❌ Falha ao enviar item para a máquina: ${response.status}`, errorBody);
        throw new Error(`Falha ao enviar para a máquina: ${response.status} ${response.statusText}`);
    }
    
    console.log(`   ✅ Item enviado com sucesso para a máquina.`);
    return await response.json();
});

const respostasDaMaquina = await Promise.all(promessasDeEnvio);
        console.log("   ✅ Itens enviados com sucesso para a fila!");

        // --- MOVEMOS O COMMIT PARA CÁ ---
        // A transação só é confirmada se tudo acima deu certo.
        await client.query('COMMIT');
        console.log("   ✅ Transação concluída (COMMIT).");

        const idsValidosDaMaquina = respostasDaMaquina
            .filter(resposta => resposta && resposta.id) 
            .map(resposta => resposta.id);

        res.status(201).json({
            message: "Pedido salvo e enviado para produção!",
            pedido: pedidoSalvo,
            idsDaMaquina: idsValidosDaMaquina
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("\n❌ ERRO GERAL AO PROCESSAR PEDIDO. A TRANSAÇÃO FOI REVERTIDA (ROLLBACK).");
        console.error("   ❗ Detalhes do erro:", err);
        console.error("   ❗ O erro ocorreu com este pedido:", JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: "Erro ao processar o pedido", details: err.message });
    
    } finally {
        client.release();
        console.log("\n--- ✅ PROCESSAMENTO CONCLUÍDO ✅ ---\n");
    }
});

// ROTA PARA BUSCAR O HISTÓRICO DE PEDIDOS DE UM CLIENTE
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    try {
        console.log(`[HISTÓRICO] Buscando pedidos para o cliente ID: ${clienteId}`);
        
        // Usamos um JOIN e agregamos os itens em um array JSON para cada pedido
        const query = `
            SELECT
                p.pedido_id,
                p.cliente_id,
                p.data_pedido,
                p.valor_total,
                p.status,
                COALESCE(
                    (SELECT json_agg(item) FROM (
                        SELECT item_id, nome_item, quantidade, valor_unitario
                        FROM itens_pedido ip
                        WHERE ip.pedido_id = p.pedido_id
                    ) AS item),
                    '[]'::json
                ) AS itens
            FROM pedidos p
            WHERE p.cliente_id = $1
            ORDER BY p.data_pedido DESC;
        `;

        const resultado = await pool.query(query, [clienteId]);
        
        res.json(resultado.rows);

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

