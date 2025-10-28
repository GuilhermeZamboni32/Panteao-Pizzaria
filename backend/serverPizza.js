import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; 
import pool from './db.js';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';

const app = express();
const PORT = 3002;

//  CONSTANTES DE ENDEREÇO 
const URL_MAQUINA_PRINCIPAL = "http://52.1.197.112:3000/queue/items";
const URL_MAQUINA_VIRTUAL = "http://localhost:3000/queue/items";
const TIMEOUT_MAQUINA_MS = 3000; // 3 segundos

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
        

        console.log("\n[PASSO 4/4] 🚀 Enviando para a fila de produção...");
        const promessasDeEnvio = pedido.itens.map(async (item) => {
            
            console.log(`   Traduzindo item (Pizza ${item.tamanho})...`);
            const payloadTraduzido = traduzirPizzaParaCaixinha(item);
            payloadTraduzido.payload.orderId = pedidoSalvo.pedido_id;

            const fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify(payloadTraduzido)
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => {
                console.log(`   TIMEOUT! Abortando requisição para MÁQUINA PRINCIPAL.`);
                controller.abort();
            }, TIMEOUT_MAQUINA_MS);


            try {
                //  TENTATIVA 1: MÁQUINA PRINCIPAL (com AbortController) 
                console.log(`   Enviando para MÁQUINA PRINCIPAL (${URL_MAQUINA_PRINCIPAL})...`);
                const response = await fetch(URL_MAQUINA_PRINCIPAL, {
                    ...fetchOptions,
                    signal: controller.signal 
                });
                clearTimeout(timeout); 
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`   ❌ Falha na MÁQUINA PRINCIPAL: ${response.status}`, errorBody);
                    throw new Error(`Falha na máquina principal: ${response.status} ${response.statusText}`);
                }
                console.log(`   ✅ Sucesso na MÁQUINA PRINCIPAL.`);
                return await response.json();
            } catch (err) {
                clearTimeout(timeout); 

    
                // Lista de erros de rede que para "offline"
                const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'];
                
                // Se for erro de TIMEOUT 
                if (err.name === 'AbortError' || (err.type === 'system' && networkErrors.includes(err.code))) {
                    const reason = err.name === 'AbortError' 
                        ? `TIMEOUT (${TIMEOUT_MAQUINA_MS}ms)` 
                        : `ERRO DE REDE (${err.code})`;

                    // TENTATIVA 2: MÁQUINA VIRTUAL (fallback) 
                    console.warn(`   ⚠️ MÁQUINA PRINCIPAL FALHOU (${reason}). Redirecionando...`);
                    console.log(`   Enviando para MÁQUINA VIRTUAL (${URL_MAQUINA_VIRTUAL})...`);
                    
                    try {
                        const vmResponse = await fetch(URL_MAQUINA_VIRTUAL, fetchOptions); 

                        if (!vmResponse.ok) {
                            const errorBody = await vmResponse.text();
                            console.error(`❌ Falha na MÁQUINA VIRTUAL: ${vmResponse.status}`, errorBody);
                            throw new Error(`Falha na máquina virtual: ${vmResponse.status} ${vmResponse.statusText}`);
                        }

                        console.log(`   ✅ Sucesso na MÁQUINA VIRTUAL (TESTE).`);
                        return await vmResponse.json();

                    } catch (vmErr) {
                        console.error("❌ FALHA CRÍTICA: Ambas as máquinas falharam.", vmErr.message);
                        throw vmErr; 
                    }

                } else {
                    // Não foi timeout nem erro de rede. Foi uma resposta com erro (404, 500)
                    console.error(`❌ Erro na MÁQUINA PRINCIPAL (não foi timeout nem rede): ${err.message}`);
                    throw err; // Propaga o erro original para dar rollback
                }
            }
        });

        const respostasDaMaquina = await Promise.all(promessasDeEnvio);
        console.log("✅ Itens enviados com sucesso para a fila!");

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
        console.error("   ❗ Detalhes do erro:", err.message);
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
        
        const query = `
            SELECT
                p.pedido_id, p.cliente_id, p.data_pedido, p.valor_total, p.status,
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
    
    const isMaquinaVirtual = machineId.startsWith('maquina-');
    const urlDeStatus = isMaquinaVirtual
        ? `http://localhost:3000/queue/items/${machineId}`
        : `http://52.1.197.112:3000/queue/items/${machineId}`;

    try {
        console.log(`[PROXY] Consultando status para ID: ${machineId} (URL: ${urlDeStatus})`);
        
        const responseDaMaquina = await fetch(urlDeStatus, {
            method: 'GET',
            headers: {
                'Authorization': isMaquinaVirtual ? undefined : 'CHAVE_SECRETA_DA_API' 
            }
        });

        if (!responseDaMaquina.ok) {
            throw new Error(`Máquina (${isMaquinaVirtual ? 'VM' : 'Principal'}) retornou status: ${responseDaMaquina.status}`);
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

