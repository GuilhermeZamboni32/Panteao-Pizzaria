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
const TIMEOUT_MAQUINA_MS = 3000; // 3 segundos

// --- CHAVE DE API (Substitua pela sua real ou use variável de ambiente) ---
const API_KEY_MAQUINA_REAL = process.env.MACHINE_API_KEY || 'CHAVE_SECRETA_DA_API';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// --- ROTA POST /api/pedidos (sem alterações) ---
app.post('/api/pedidos', async (req, res) => {
    const pedido = req.body;
    const client = await pool.connect();

    console.log(`\n\n--- 🍕 NOVO PEDIDO RECEBIDO [${new Date().toLocaleTimeString()}] 🍕 ---`);

    try {
        // Validações
        if (!pedido.itens || pedido.itens.length === 0) {
            return res.status(400).json({ error: "Pedido sem itens" });
        }
        if (!pedido.usuario || !pedido.usuario.id) {
            return res.status(400).json({ error: "Pedido sem usuário válido" });
        }

        await client.query('BEGIN');
        console.log("\n[PASSO 1/4] 💾 Iniciando transação...");

        // Salva pedido principal
        console.log("[PASSO 2/4] 💾 Inserindo pedido principal...");
        const clienteId = pedido.usuario.id;
        const precos = { Broto: 25, Média: 30, Grande: 45 }; // Definição de exemplo
        const valorTotalCalculado = pedido.itens.reduce((soma, item) => soma + (precos[item.tamanho] || 0), 0) + 5; // + frete

        const pedidoQuery = `INSERT INTO pedidos (cliente_id, valor_total, status) VALUES ($1, $2, $3) RETURNING *`;
        const novoPedidoResult = await client.query(pedidoQuery, [clienteId, valorTotalCalculado, 'Recebido']);
        const pedidoSalvo = novoPedidoResult.rows[0];
        console.log(`   ✅ Pedido principal salvo (ID BD: ${pedidoSalvo.pedido_id})`);

        // Salva itens do pedido
        console.log("[PASSO 3/4] 💾 Inserindo itens...");
        const itemInsertPromises = pedido.itens.map(item => {
            const nomeDoItem = `Pizza ${item.tamanho} (${item.ingredientes.map(i => i.nome).join(', ')})`;
            const valorUnitario = precos[item.tamanho] || 0;
            const itemQuery = `INSERT INTO itens_pedido (pedido_id, nome_item, quantidade, valor_unitario) VALUES ($1, $2, $3, $4)`;
            return client.query(itemQuery, [pedidoSalvo.pedido_id, nomeDoItem, 1, valorUnitario]);
        });
        await Promise.all(itemInsertPromises);
        console.log(`   ✅ ${pedido.itens.length} itens salvos.`);

        // Envia itens para a máquina (com failover)
        console.log("\n[PASSO 4/4] 🚀 Enviando para produção...");
        const promessasDeEnvio = pedido.itens.map(async (item, index) => {
            const payloadTraduzido = traduzirPizzaParaCaixinha(item);
            payloadTraduzido.payload.orderId = pedidoSalvo.pedido_id; // Usa ID real do BD

            const fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadTraduzido)
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), TIMEOUT_MAQUINA_MS);

            try { // Tenta Máquina Principal
                console.log(`   Enviando item ${index + 1} para MÁQUINA PRINCIPAL...`);
                fetchOptions.headers['Authorization'] = API_KEY_MAQUINA_REAL;
                const response = await fetch(URL_MAQUINA_PRINCIPAL, { ...fetchOptions, signal: controller.signal });
                clearTimeout(timeout);
                if (!response.ok) throw new Error(`Máquina principal falhou: ${response.status}`);
                console.log(`   ✅ Sucesso MÁQUINA PRINCIPAL item ${index + 1}.`);
                return await response.json();
            } catch (err) { // Falha na Principal -> Tenta Virtual
                clearTimeout(timeout);
                const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'];
                if (err.name === 'AbortError' || (err.type === 'system' && networkErrors.includes(err.code))) {
                    const reason = err.name === 'AbortError' ? `TIMEOUT` : `ERRO REDE (${err.code})`;
                    console.warn(`   ⚠️ MÁQUINA PRINCIPAL FALHOU item ${index + 1} (${reason}). Redirecionando p/ VM...`);
                    try { // Tenta Máquina Virtual
                        delete fetchOptions.headers['Authorization']; // Remove Auth se VM não precisar
                        const vmResponse = await fetch(URL_MAQUINA_VIRTUAL, fetchOptions);
                        if (!vmResponse.ok) throw new Error(`Máquina virtual falhou: ${vmResponse.status}`);
                        console.log(`   ✅ Sucesso MÁQUINA VIRTUAL item ${index + 1}.`);
                        return await vmResponse.json();
                    } catch (vmErr) { // Ambas falharam
                        console.error(`   ❌ FALHA CRÍTICA item ${index + 1}: Ambas falharam.`, vmErr.message);
                        throw vmErr; // Lança erro para Rollback
                    }
                } else { // Erro diferente na Principal (4xx, 5xx)
                    console.error(`   ❌ Erro MÁQUINA PRINCIPAL item ${index + 1} (não timeout/rede): ${err.message}`);
                    throw err; // Lança erro para Rollback
                }
            }
        });

        const respostasDaMaquina = await Promise.all(promessasDeEnvio);
        await client.query('COMMIT'); // Confirma no banco APÓS sucesso no envio
        console.log("   ✅ Transação banco concluída (COMMIT).");

        const idsValidosDaMaquina = respostasDaMaquina.filter(r => r && r.id).map(r => r.id);
        res.status(201).json({ message: "Pedido salvo!", pedido: pedidoSalvo, idsDaMaquina: idsValidosDaMaquina });

    } catch (err) {
        await client.query('ROLLBACK'); // Desfaz alterações no banco em caso de erro
        console.error("\n❌ ERRO GERAL PEDIDO (ROLLBACK):", err.message);
        res.status(500).json({ error: "Erro interno", details: err.message });
    } finally {
        client.release(); // Libera conexão com o banco
        console.log("\n--- ✅ PROCESSAMENTO PEDIDO CONCLUÍDO ✅ ---\n");
    }
});

// --- ROTA GET /api/pedidos/cliente/:clienteId (sem alterações) ---
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    if (!clienteId) return res.status(400).json({ error: 'ID do cliente não fornecido.' });
    try {
        const query = `
            SELECT p.pedido_id, p.data_pedido, p.valor_total, p.status,
                   COALESCE(json_agg(json_build_object('nome_item', ip.nome_item, 'valor_unitario', ip.valor_unitario)) FILTER (WHERE ip.item_id IS NOT NULL), '[]'::json) AS itens
            FROM pedidos p LEFT JOIN itens_pedido ip ON p.pedido_id = ip.pedido_id
            WHERE p.cliente_id = $1 GROUP BY p.pedido_id ORDER BY p.data_pedido DESC;
        `;
        const resultado = await pool.query(query, [clienteId]);
        res.json(resultado.rows);
    } catch (err) {
        console.error(`[HISTÓRICO] Erro cliente ${clienteId}:`, err.message);
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
});


// ROTA PROXY GET /api/pedidos/status/:machineId (com adição de slot aleatório FORMATADO)
app.get('/api/pedidos/status/:machineId', async (req, res) => {
    const { machineId } = req.params;
    if (!machineId) {
        return res.status(400).json({ error: 'ID da máquina não fornecido.' });
    }

    const isMaquinaVirtual = machineId.startsWith('maquina-');
    const targetUrl = isMaquinaVirtual ? URL_MAQUINA_VIRTUAL : URL_MAQUINA_PRINCIPAL;
    const urlDeStatus = `${targetUrl}/${machineId}`;

    try {
        console.log(`[PROXY STATUS] Consultando ID: ${machineId} em ${urlDeStatus}`);
        const headers = {};
        if (!isMaquinaVirtual) {
            headers['Authorization'] = API_KEY_MAQUINA_REAL; // Usa a chave correta
        }

        const responseDaMaquina = await fetch(urlDeStatus, { method: 'GET', headers: headers });

        if (!responseDaMaquina.ok) {
             if (responseDaMaquina.status === 404) {
                 console.warn(`[PROXY STATUS] Máquina (${isMaquinaVirtual ? 'VM' : 'Principal'}) 404 para ${machineId}`);
                 return res.status(404).json({ status: 'Pedido não encontrado', slot: null });
             }
            throw new Error(`Máquina (${isMaquinaVirtual ? 'VM' : 'Principal'}) status: ${responseDaMaquina.status}`);
        }

        let statusData = await responseDaMaquina.json(); // Pega a resposta
        console.log(`[PROXY STATUS] Resposta original da máquina para ${machineId}:`, statusData);

        //  SLOT ALEATÓRIO 
        if (!isMaquinaVirtual &&
            statusData.status &&
            statusData.status.toUpperCase() === 'COMPLETED' &&
            !statusData.slot 
        ) {
            const numeroSlot = Math.floor(Math.random() * 12) + 1;
            const numeroFormatado = String(numeroSlot).padStart(2, '0');

            // Cria a string final no formato "Slot:XX"
            const slotSimulado = `Slot:${numeroFormatado}`;

            statusData.slot = slotSimulado; // Adiciona o slot simulado
            console.log(`[PROXY STATUS] Slot não veio da máquina real (ou estava vazio). Adicionando slot simulado: ${slotSimulado}`);
        }

        res.json(statusData); // Envia para o frontend (com ou sem slot simulado)

    } catch (err) {
        console.error(`[PROXY STATUS] Erro ao buscar status para ${machineId}:`, err.message);
        res.status(500).json({ error: 'Erro consulta status', details: err.message, status: 'Erro na consulta', slot: null });
    }
});


app.listen(PORT, () => {
    console.log(`✅ Servidor Pizzaria rodando na porta ${PORT}`);
    console.log(`   📞 Endpoint de Pedidos: http://localhost:${PORT}/api/pedidos`);
    console.log(`   📊 Endpoint de Status: http://localhost:${PORT}/api/pedidos/status/:machineId`);
    console.log(`   📜 Endpoint de Histórico: http://localhost:${PORT}/api/pedidos/cliente/:clienteId`);
});

