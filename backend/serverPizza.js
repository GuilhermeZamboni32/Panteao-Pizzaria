import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pool from './db.js';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';





const app = express();
const PORT = 3002;

//  CONSTANTES DE ENDEREÇO E TIMEOUT 
const URL_MAQUINA_PRINCIPAL = "http://52.1.197.112:3000/queue/items";
const URL_MAQUINA_VIRTUAL = "http://localhost:3000/queue/items";
const TIMEOUT_MAQUINA_MS = 3000;
const API_KEY_MAQUINA_REAL = process.env.MACHINE_API_KEY || 'CHAVE_SECRETA_DA_API';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Definição de preços das pizzas
const precos = { Broto: 25, Média: 30, Grande: 45 };

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
        console.log("\n[PASSO 1/4] 💾 Iniciando transação...");

        // Salva pedido principal
        console.log("[PASSO 2/4] 💾 Inserindo pedido principal...");
        const clienteId = pedido.usuario.id;
        const valorTotalCalculado = pedido.itens.reduce((soma, item) => soma + (precos[item.tamanho] || 0), 0) + 5; // Adiciona frete

        const pedidoQuery = `INSERT INTO pedidos (cliente_id, valor_total, status) VALUES ($1, $2, $3) RETURNING *`;
        const novoPedidoResult = await client.query(pedidoQuery, [clienteId, valorTotalCalculado, 'Recebido']);
        const pedidoSalvo = novoPedidoResult.rows[0];
        console.log(`   ✅ Pedido principal salvo (ID BD: ${pedidoSalvo.pedido_id})`);


        // Salva os itens do pedido
        console.log("[PASSO 3/4] 💾 Inserindo itens...");
        // MUDANÇA 1: Capturar os item_ids e nomes salvos 
        const itensSalvos = [];
        for (const item of pedido.itens) {
            const nomeDoItem = `Pizza ${item.tamanho} (${item.ingredientes.map(i => i.nome).join(', ')})`;
            const valorUnitario = precos[item.tamanho] || 0;
            // Pede ao BD para retornar o ID e o Nome que ele acabou de criar
            const itemQuery = `INSERT INTO itens_pedido (pedido_id, nome_item, quantidade, valor_unitario) VALUES ($1, $2, $3, $4) RETURNING item_id, nome_item`;
            const itemResult = await client.query(itemQuery, [pedidoSalvo.pedido_id, nomeDoItem, 1, valorUnitario]);
            itensSalvos.push(itemResult.rows[0]); // Guarda { item_id, nome_item }
        }
        console.log(`   ✅ ${itensSalvos.length} itens salvos no banco.`);


        // Envia cada item (pizza) para a máquina
        console.log("\n[PASSO 4/4] 🚀 Enviando para produção...");
        //  Usa map com index para ligar o item salvo ao item do pedido 
        const promessasDeEnvio = pedido.itens.map(async (item, index) => {
            const itemSalvo = itensSalvos[index]; // Pega o item correspondente que foi salvo no BD { item_id, nome_item }

            const payloadTraduzido = traduzirPizzaParaCaixinha(item);
            payloadTraduzido.payload.orderId = pedidoSalvo.pedido_id; // ID do Pedido
            
            //  Adiciona o ID e Nome do item ao payload da máquina 
            // Isso permite-nos saber qual item é este quando verificamos o status
            payloadTraduzido.payload.itemId = itemSalvo.item_id; 
            payloadTraduzido.payload.nomeItem = itemSalvo.nome_item;

            const fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadTraduzido)
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), TIMEOUT_MAQUINA_MS);

            try { // Tenta Máquina Principal
                fetchOptions.headers['Authorization'] = API_KEY_MAQUINA_REAL;
                const response = await fetch(URL_MAQUINA_PRINCIPAL, { ...fetchOptions, signal: controller.signal });
                clearTimeout(timeout);
                if (!response.ok) throw new Error(`Máquina principal falhou: ${response.status}`);
                return await response.json();
            } catch (err) { // Falha na Principal -> Tenta Virtual
                clearTimeout(timeout);
                const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET'];
                if (err.name === 'AbortError' || (err.type === 'system' && networkErrors.includes(err.code))) {
                    const reason = err.name === 'AbortError' ? `TIMEOUT` : `ERRO REDE (${err.code})`;
                    console.warn(`   ⚠️ MÁQUINA PRINCIPAL FALHOU (${reason}). Redirecionando p/ VM...`);
                    try { // Tenta Máquina Virtual
                        delete fetchOptions.headers['Authorization'];
                        const vmResponse = await fetch(URL_MAQUINA_VIRTUAL, fetchOptions);
                        if (!vmResponse.ok) throw new Error(`Máquina virtual falhou: ${vmResponse.status}`);
                        return await vmResponse.json();
                    } catch (vmErr) {
                        throw vmErr; // Lança erro para Rollback
                    }
                } else {
                    throw err; // Lança erro para Rollback
                }
            }
        });

        const respostasDaMaquina = await Promise.all(promessasDeEnvio);
        await client.query('COMMIT');
        console.log("   ✅ Transação banco concluída (COMMIT).");

        const idsValidosDaMaquina = respostasDaMaquina.filter(r => r && r.id).map(r => r.id);
        res.status(201).json({ message: "Pedido salvo!", pedido: pedidoSalvo, idsDaMaquina: idsValidosDaMaquina });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("\n❌ ERRO GERAL PEDIDO (ROLLBACK):", err.message);
        res.status(500).json({ error: "Erro interno", details: err.message });
    } finally {
        client.release();
        console.log("\n--- ✅ PROCESSAMENTO PEDIDO CONCLUÍDO ✅ ---\n");
    }
});

//  ROTA GET /api/pedidos/cliente/:clienteId 
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    if (!clienteId) return res.status(400).json({ error: 'ID do cliente não fornecido.' });
    try {
        const query = `
            SELECT p.pedido_id, p.data_pedido, p.valor_total, p.status,
                   COALESCE(json_agg(json_build_object('item_id', ip.item_id, 'nome_item', ip.nome_item, 'valor_unitario', ip.valor_unitario)) FILTER (WHERE ip.item_id IS NOT NULL), '[]'::json) AS itens
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


//  ROTA PROXY GET /api/pedidos/status/:machineId 
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
            headers['Authorization'] = API_KEY_MAQUINA_REAL;
        }

        const responseDaMaquina = await fetch(urlDeStatus, { method: 'GET', headers: headers });

        if (!responseDaMaquina.ok) {
             if (responseDaMaquina.status === 404) {
                 return res.status(404).json({ status: 'Pedido não encontrado', slot: null, nome_item: 'Item não encontrado' });
             }
            throw new Error(`Máquina (${isMaquinaVirtual ? 'VM' : 'Principal'}) status: ${responseDaMaquina.status}`);
        }

        let statusData = await responseDaMaquina.json(); // Pega a resposta da máquina
        console.log(`[PROXY STATUS] Resposta original da máquina para ${machineId}:`, statusData);

        //  Buscar o nome_item no nosso BD 
        let nomeItemDoBD = null;
        let itemIdDoPayload = null;
        
        // A máquina real pode ter o 'itemId' no payload, a virtual pode ter
        if (statusData.payload && statusData.payload.itemId) {
            itemIdDoPayload = statusData.payload.itemId;
        } else if (isMaquinaVirtual && statusData.payload && statusData.payload.payload) { // A VM pode aninhar o payload
             itemIdDoPayload = statusData.payload.payload.itemId;
        }

        if (itemIdDoPayload) {
            try {
                // Busca o nome no seu banco de dados
                const itemQuery = 'SELECT nome_item FROM itens_pedido WHERE item_id = $1';
                const itemResult = await pool.query(itemQuery, [itemIdDoPayload]);
                if (itemResult.rows.length > 0) {
                    nomeItemDoBD = itemResult.rows[0].nome_item;
                    console.log(`[PROXY STATUS] Nome do item encontrado no BD: ${nomeItemDoBD}`);
                }
            } catch (dbErr) {
                console.error(`Erro ao buscar nome do item ${itemIdDoPayload} no BD:`, dbErr);
            }
        }
        
        // Fallback para o nome guardado na máquina (se o BD falhar)
        if (!nomeItemDoBD) {
            nomeItemDoBD = (statusData.payload && statusData.payload.nomeItem) || 
                           (isMaquinaVirtual && statusData.payload && statusData.payload.payload && statusData.payload.payload.nomeItem);
        }

        // Adicionar slot aleatório 
        if (!isMaquinaVirtual &&
            statusData.status &&
            statusData.status.toUpperCase() === 'COMPLETED' &&
            !statusData.slot
        ) {
            const numeroSlot = Math.floor(Math.random() * 12) + 1;
            const numeroFormatado = String(numeroSlot).padStart(2, '0');
            statusData.slot = `Slot:${numeroFormatado}`;
            console.log(`[PROXY STATUS] Adicionando slot simulado: ${statusData.slot}`);
        }
        
        // Enviar resposta final para o frontend 
        res.json({
            id: statusData.id || machineId,
            status: statusData.status || "Desconhecido",
            slot: statusData.slot || null,
            nome_item: nomeItemDoBD || "Item não identificado" // Adiciona o nome
        });

    } catch (err) {
        console.error(`[PROXY STATUS] Erro ao buscar status para ${machineId}:`, err.message);
        res.status(500).json({ error: 'Erro consulta status', details: err.message, status: 'Erro na consulta', slot: null, nome_item: 'Erro' });
    }
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor Pizzaria rodando na porta ${PORT}`);
});

