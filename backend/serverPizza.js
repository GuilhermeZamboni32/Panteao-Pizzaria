import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pool from './db.js';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';

const app = express();
const PORT = 3002;

// --- CONSTANTES DE ENDEREÇO E TIMEOUT ---
const URL_MAQUINA_PRINCIPAL = "http://52.1.197.112:3000/queue/items";
const URL_MAQUINA_VIRTUAL = "http://localhost:3000/queue/items";
const TIMEOUT_MAQUINA_MS = 3000; // 3 segundos (ajustado anteriormente)

// --- CHAVE DE API (Exemplo - substitua pela sua real) ---
// É importante usar uma variável de ambiente para isso em produção (.env)
const API_KEY_MAQUINA_REAL = process.env.MACHINE_API_KEY || 'CHAVE_SECRETA_DA_API'; // Use a chave real aqui

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ROTA PARA CRIAR UM NOVO PEDIDO
app.post('/api/pedidos', async (req, res) => {
    const pedido = req.body;
    const client = await pool.connect();

    console.log(`\n\n--- 🍕 NOVO PEDIDO RECEBIDO [${new Date().toLocaleTimeString()}] 🍕 ---`);

    try {
        // Validações básicas do pedido
        if (!pedido.itens || pedido.itens.length === 0) {
            return res.status(400).json({ error: "Pedido sem itens" });
        }
        if (!pedido.usuario || !pedido.usuario.id) {
            return res.status(400).json({ error: "Pedido sem usuário válido" });
        }

        await client.query('BEGIN');
        console.log("\n[PASSO 1/4] 💾 Iniciando transação no banco de dados...");

        // Salva o pedido principal no banco
        console.log("[PASSO 2/4] 💾 Inserindo o registro principal do pedido...");
        const clienteId = pedido.usuario.id;
        // Assume que 'precos' está definido em algum lugar globalmente ou importe-o
        const precos = { Broto: 25, Média: 30, Grande: 45 }; // Definição de exemplo
        const valorTotalCalculado = pedido.itens.reduce((soma, item) => soma + (precos[item.tamanho] || 0), 0) + 5; // Adiciona frete

        const pedidoQuery = `INSERT INTO pedidos (cliente_id, valor_total, status) VALUES ($1, $2, $3) RETURNING *`;
        const novoPedidoResult = await client.query(pedidoQuery, [clienteId, valorTotalCalculado, 'Recebido']); // Use valorTotalCalculado
        const pedidoSalvo = novoPedidoResult.rows[0];
        console.log(`   ✅ Pedido principal salvo com sucesso! (ID no BD: ${pedidoSalvo.pedido_id})`);


        // Salva os itens do pedido no banco
        console.log("[PASSO 3/4] 💾 Inserindo os itens do pedido...");
        const itemInsertPromises = pedido.itens.map(item => {
            const nomeDoItem = `Pizza ${item.tamanho} (${item.ingredientes.map(i => i.nome).join(', ')})`;
            const valorUnitario = precos[item.tamanho] || 0; // Pega o preço base do tamanho
            const itemQuery = `INSERT INTO itens_pedido (pedido_id, nome_item, quantidade, valor_unitario) VALUES ($1, $2, $3, $4)`;
            return client.query(itemQuery, [pedidoSalvo.pedido_id, nomeDoItem, 1, valorUnitario]);
        });
        await Promise.all(itemInsertPromises);
        console.log(`   ✅ ${pedido.itens.length} itens salvos com sucesso!`);


        // Envia cada item (pizza) para a máquina de produção
        console.log("\n[PASSO 4/4] 🚀 Enviando para a fila de produção...");
        const promessasDeEnvio = pedido.itens.map(async (item, index) => {
            console.log(`   Traduzindo item ${index + 1}/${pedido.itens.length} (Pizza ${item.tamanho})...`);
            const payloadTraduzido = traduzirPizzaParaCaixinha(item);
            // Garante que o ID do pedido no payload seja o ID real do banco
            payloadTraduzido.payload.orderId = pedidoSalvo.pedido_id;

            const fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadTraduzido)
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => {
                console.log(`   TIMEOUT para item ${index + 1}! Abortando requisição para MÁQUINA PRINCIPAL.`);
                controller.abort();
            }, TIMEOUT_MAQUINA_MS);

            // Tenta enviar para a máquina principal com failover para a virtual
            try {
                console.log(`   Enviando item ${index + 1} para MÁQUINA PRINCIPAL (${URL_MAQUINA_PRINCIPAL})...`);
                fetchOptions.headers['Authorization'] = API_KEY_MAQUINA_REAL; // Adiciona Auth para máquina real

                const response = await fetch(URL_MAQUINA_PRINCIPAL, {
                    ...fetchOptions,
                    signal: controller.signal
                });
                clearTimeout(timeout); // Cancela o timer se respondeu a tempo

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`   ❌ Falha na MÁQUINA PRINCIPAL para item ${index + 1}: ${response.status}`, errorBody);
                    throw new Error(`Falha na máquina principal: ${response.status} ${response.statusText}`);
                }
                console.log(`   ✅ Sucesso na MÁQUINA PRINCIPAL para item ${index + 1}.`);
                return await response.json();

            } catch (err) {
                clearTimeout(timeout); // Garante que o timer seja limpo em qualquer erro

                const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'];
                // Verifica se foi timeout ou erro de rede
                if (err.name === 'AbortError' || (err.type === 'system' && networkErrors.includes(err.code))) {
                    const reason = err.name === 'AbortError' ? `TIMEOUT (${TIMEOUT_MAQUINA_MS}ms)` : `ERRO DE REDE (${err.code})`;

                    console.warn(`   ⚠️ MÁQUINA PRINCIPAL FALHOU para item ${index + 1} (${reason}). Redirecionando...`);
                    console.log(`   Enviando item ${index + 1} para MÁQUINA VIRTUAL (${URL_MAQUINA_VIRTUAL})...`);

                    try {
                        // Remove Auth header para máquina virtual (se não precisar)
                        delete fetchOptions.headers['Authorization'];
                        const vmResponse = await fetch(URL_MAQUINA_VIRTUAL, fetchOptions);

                        if (!vmResponse.ok) {
                            const errorBody = await vmResponse.text();
                            console.error(`   ❌ Falha na MÁQUINA VIRTUAL para item ${index + 1}: ${vmResponse.status}`, errorBody);
                            throw new Error(`Falha na máquina virtual: ${vmResponse.status} ${vmResponse.statusText}`);
                        }
                        console.log(`   ✅ Sucesso na MÁQUINA VIRTUAL (TESTE) para item ${index + 1}.`);
                        return await vmResponse.json();

                    } catch (vmErr) {
                        console.error(`   ❌ FALHA CRÍTICA para item ${index + 1}: Ambas as máquinas falharam.`, vmErr.message);
                        throw vmErr; // Lança o erro para dar rollback na transação do banco
                    }
                } else {
                    // Erro diferente (ex: 4xx, 5xx da máquina principal)
                    console.error(`   ❌ Erro na MÁQUINA PRINCIPAL para item ${index + 1} (não foi timeout/rede): ${err.message}`);
                    throw err; // Lança o erro para dar rollback
                }
            }
        });

        // Espera todas as tentativas de envio (principal ou virtual) terminarem
        const respostasDaMaquina = await Promise.all(promessasDeEnvio);
        console.log("   ✅ Todos os itens processados (enviados com sucesso para alguma máquina).");

        // Se chegou aqui, todos os envios deram certo (para uma das máquinas), então confirma no banco
        await client.query('COMMIT');
        console.log("   ✅ Transação do banco de dados concluída (COMMIT).");

        // Pega os IDs retornados pelas máquinas (real ou virtual)
        const idsValidosDaMaquina = respostasDaMaquina
            .filter(resposta => resposta && resposta.id)
            .map(resposta => resposta.id);

        // Envia a resposta de sucesso para o frontend
        res.status(201).json({
            message: "Pedido salvo e enviado para produção!",
            pedido: pedidoSalvo, // Informações do pedido salvo no BD
            idsDaMaquina: idsValidosDaMaquina // IDs dos itens nas máquinas (real ou virtual)
        });

    } catch (err) {
        // Se qualquer passo falhar (banco ou envio para *ambas* as máquinas), desfaz tudo no banco
        await client.query('ROLLBACK');
        console.error("\n❌ ERRO GERAL AO PROCESSAR PEDIDO. A TRANSAÇÃO FOI REVERTIDA (ROLLBACK).");
        console.error("   ❗ Detalhes do erro:", err.message);
        console.error("   ❗ O erro ocorreu com este pedido:", JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: "Erro interno ao processar o pedido", details: err.message });

    } finally {
        // Libera a conexão com o banco de dados
        client.release();
        console.log("\n--- ✅ PROCESSAMENTO DO PEDIDO CONCLUÍDO ✅ ---\n");
    }
});

// ROTA PARA BUSCAR O HISTÓRICO DE PEDIDOS DE UM CLIENTE
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    if (!clienteId) {
        return res.status(400).json({ error: 'ID do cliente não fornecido.' });
    }
    try {
        console.log(`[HISTÓRICO] Buscando pedidos para o cliente ID: ${clienteId}`);
        const query = `
            SELECT
                p.pedido_id, p.cliente_id, p.data_pedido, p.valor_total, p.status,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'item_id', ip.item_id,
                        'nome_item', ip.nome_item,
                        'quantidade', ip.quantidade,
                        'valor_unitario', ip.valor_unitario
                    ))
                     FROM itens_pedido ip
                     WHERE ip.pedido_id = p.pedido_id),
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
        res.status(500).json({ error: 'Erro ao buscar histórico de pedidos.' });
    }
});

// ROTA PROXY PARA BUSCAR O STATUS DE UM ITEM NA MÁQUINA
app.get('/api/pedidos/status/:machineId', async (req, res) => {
    const { machineId } = req.params;
    if (!machineId) {
        return res.status(400).json({ error: 'ID da máquina não fornecido.' });
    }

    const isMaquinaVirtual = machineId.startsWith('maquina-');
    const targetUrl = isMaquinaVirtual ? URL_MAQUINA_VIRTUAL : URL_MAQUINA_PRINCIPAL;
    const urlDeStatus = `${targetUrl}/${machineId}`; // Monta a URL completa

    try {
        console.log(`[PROXY STATUS] Consultando ID: ${machineId} em ${urlDeStatus}`);
        const headers = {};
        // Adiciona Authorization APENAS se for a máquina principal
        if (!isMaquinaVirtual) {
            headers['Authorization'] = API_KEY_MAQUINA_REAL;
        }

        const responseDaMaquina = await fetch(urlDeStatus, { method: 'GET', headers: headers });

        if (!responseDaMaquina.ok) {
             if (responseDaMaquina.status === 404) {
                 console.warn(`[PROXY STATUS] Máquina (${isMaquinaVirtual ? 'VM' : 'Principal'}) retornou 404 para ${machineId}`);
                 // Retorna um status específico para o frontend identificar
                 return res.status(404).json({ status: 'Pedido não encontrado', slot: null });
             }
            throw new Error(`Máquina (${isMaquinaVirtual ? 'VM' : 'Principal'}) retornou status: ${responseDaMaquina.status}`);
        }

        const statusData = await responseDaMaquina.json();
        console.log(`[PROXY STATUS] Resposta da máquina para ${machineId}:`, statusData);
        // Repassa o JSON completo {id, status, slot}
        res.json(statusData);

    } catch (err) {
        console.error(`[PROXY STATUS] Erro ao buscar status para ${machineId}:`, err.message);
        // Retorna um status de erro genérico com slot null
        res.status(500).json({ error: 'Erro ao consultar o status na máquina', details: err.message, status: 'Erro na consulta', slot: null });
    }
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor Pizzaria rodando na porta ${PORT}`);
    console.log(`   📞 Endpoint de Pedidos: http://localhost:${PORT}/api/pedidos`);
    console.log(`   📊 Endpoint de Status: http://localhost:${PORT}/api/pedidos/status/:machineId`);
    console.log(`   📜 Endpoint de Histórico: http://localhost:${PORT}/api/pedidos/cliente/:clienteId`);
});

