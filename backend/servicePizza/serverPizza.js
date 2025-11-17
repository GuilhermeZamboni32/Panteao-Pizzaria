import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pool from '../serviceDatabase/db.js';

const app = express();
const PORT = 3002;

// --- CONSTANTES ---
const URL_MAQUINA_PRINCIPAL = "http://52.1.197.112:3000/queue/items";
const URL_ESTOQUE_PRINCIPAL = "http://52.1.197.112:3000/estoque";
const URL_MAQUINA_VIRTUAL = "http://localhost:3000/queue/items";
const URL_ESTOQUE_VIRTUAL = "http://localhost:3000/estoque"; 
const URL_SERVICO_IA = 'http://localhost:5003/api/ai';


//  URL PÚBLICA do seu servidor 
// A máquina precisa conseguir acessar esta URL. 'localhost' NÃO VAI FUNCIONAR.
const MINHA_URL_DE_CALLBACK = process.env.PUBLIC_CALLBACK_URL || 'http://52.1.197.112:3002/api/webhook/status';


const TIMEOUT_MAQUINA_MS = 3000;
const API_KEY_MAQUINA_REAL = process.env.MACHINE_API_KEY || 'CHAVE_SECRETA_DA_API';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());


const precos = { Broto: 25, Média: 30, Grande: 45 };

function contarEstoque(estoqueDaMaquina) {
    let massas = 0;
    let molhoSalgado = 0;
    let molhoDoce = 0;
    if (!Array.isArray(estoqueDaMaquina)) {
        console.error("[contarEstoque] ERRO: A entrada não era um array. Retornando 0.");
        return { massas, molhoSalgado, molhoDoce };
    }
    for (const item of estoqueDaMaquina) {
        if (item.cor == 1 || item.cor === 'preto') {
            massas++;
        } else if (item.cor == 2 || item.cor === 'vermelho') { 
            molhoSalgado++;
        } else if (item.cor == 3 || item.cor === 'azul') { 
            molhoDoce++;
        }
    }
    const resultado = { massas, molhoSalgado, molhoDoce };
    return resultado;
}

async function getRecomendacaoIA(itensDoPedido) {
    try {
        const listaItens = itensDoPedido.map(item => 
            item.nome_item || `Pizza ${item.tamanho}`
        ).join(', ');

        const prompt = ` 
                Você é um assistente da Panteão Pizzaria, e você se chama "Dionísio". 
                Sua tarefa é recomendar UMA bebida para acompanhar o pedido de pizza.

                **REGRAS IMPORTANTES:**
                1.  **FOCO TOTAL:** Recomende apenas bebidas comuns e populares no Brasil.

                2.  **PERMITIDO:** Refrigerantes (como Coca-Cola, Coca-Cola Zero, Guaraná, Fanta, Sprite, etc.), 
                                Cervejas populares (como Skol, Brahma, Heineken, polar, antartica, etc.), e 
                                sucos (suco de laranja, suco de morango, suco de uva, etc.).

                3.  **PROIBIDO:** NÃO recomende vinhos, espumantes, champanhes ou bebidas "gourmet" ou "artesanais".

                4.  **SEJA BREVE:** Dê uma recomendação curta e amigável em uma única frase.
                        **EXEMPLOS DE COMO VOCÊ DEVE RESPONDER:**
                            * Para uma pizza salgada (ex: frango com queijo): "Para essa pizza, um Guaraná geladinho cai super bem!" ou "Uma cerveja (como Skol ou Heineken) harmoniza perfeitamente com esse pedido."
                            * Para uma pizza muito doce (ex: chocolate): "Para equilibrar o doce, que tal uma Coca-Cola Zero?"
                
                5. **PARA COMBINAÇÔES MALUCAS** 
                    (ex: pizza de chocolate com calabresa): "Essa é uma combinação única! Eu recomendaria um refrigerente de ovo com café."

                **O PEDIDO ATUAL DO CLIENTE É:**
                [${listaItens}]

                **Qual é a sua sugestão de bebida?**
                `;

        const responseIA = await fetch(URL_SERVICO_IA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt })
        });
        if (!responseIA.ok) {
            throw new Error('O microserviço de IA (porta 5003) falhou.');
        }
        const data = await responseIA.json();
        return data.reply; 

    } catch (err) {
        console.error("Erro ao chamar o microserviço de IA:", err.message);
        return null;
    }
}


// --- ROTA POST /api/pedidos (MODIFICADA) ---
app.post('/api/pedidos', async (req, res) => {
    const pedido = req.body;
    const client = await pool.connect();

    console.log(`\n\n--- 🍕 NOVO PEDIDO RECEBIDO [${new Date().toLocaleTimeString()}] 🍕 ---`);

    try {
        // Validações...
        if (!pedido.itens || pedido.itens.length === 0) {
            return res.status(400).json({ error: "Pedido sem itens" });
        }
        if (!pedido.usuario || !pedido.usuario.id) {
            return res.status(400).json({ error: "Pedido sem usuário válido" });
        }

        await client.query('BEGIN');
        console.log("\n[PASSO 1/5] 💾 Iniciando transação...");

        // Salva pedido principal
        console.log("[PASSO 2/5] 💾 Inserindo pedido principal...");
        const clienteId = pedido.usuario.id;
        const valorTotalCalculado = pedido.itens.reduce((soma, item) => soma + (precos[item.tamanho] || 0), 0) + 5; // + frete

        const pedidoQuery = `INSERT INTO pedidos (cliente_id, valor_total, status) VALUES ($1, $2, $3) RETURNING *`;
        const novoPedidoResult = await client.query(pedidoQuery, [clienteId, valorTotalCalculado, 'Recebido']);
        const pedidoSalvo = novoPedidoResult.rows[0];
        console.log(`   ✅ Pedido principal salvo (ID BD: ${pedidoSalvo.pedido_id})`);

        // Salva os itens do pedido
        console.log("[PASSO 3/5] 💾 Inserindo itens...");
        const itensSalvos = [];
        for (const item of pedido.itens) {
            const nomeDoItem = item.nome_item || `Pizza ${item.tamanho} (${(item.ingredientes || []).map(i => i.nome).join(', ')})`;
            const valorUnitario = (item.origem === 'historico' ? item.preco : (precos[item.tamanho] || 0));
            
            // Adiciona status_maquina inicial
            const itemQuery = `
                INSERT INTO itens_pedido (pedido_id, nome_item, quantidade, valor_unitario, status_maquina) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING item_id, nome_item`;
            const itemResult = await client.query(itemQuery, [pedidoSalvo.pedido_id, nomeDoItem, 1, valorUnitario, 'Enviando...']);
            itensSalvos.push(itemResult.rows[0]);
        }
        console.log(`   ✅ ${itensSalvos.length} itens salvos no banco.`);

        // Envia cada item (pizza) para a máquina
        console.log("\n[PASSO 4/5] 🚀 Enviando para produção...");
        const respostasDaMaquina = [];
        const idsDaMaquinaParaCliente = [];

        for (let i = 0; i < pedido.itens.length; i++) {
            const item = pedido.itens[i];
            const itemSalvo = itensSalvos[i]; // item_id, nome_item

            // Chama o microserviço de tradução
            const tradutorResponse = await fetch('http://localhost:3004/api/traduzir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!tradutorResponse.ok) throw new Error('Falha no microserviço de tradução');

            const payloadTraduzido = await tradutorResponse.json();
            
            // Adiciona nossos IDs e a URL DE CALLBACK ao payload
            payloadTraduzido.payload.orderId = pedidoSalvo.pedido_id;
            payloadTraduzido.payload.itemId = itemSalvo.item_id; // Nosso ID interno do BD
            payloadTraduzido.payload.nomeItem = itemSalvo.nome_item;
            // --- SPRINT 03: ADICIONA O CALLBACK URL ---
            payloadTraduzido.payload.callbackUrl = MINHA_URL_DE_CALLBACK;
            // --- FIM SPRINT 03 ---

            const fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadTraduzido)
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), TIMEOUT_MAQUINA_MS);
            
            let respostaMaquina;
            try { // Tenta Máquina Principal
                fetchOptions.headers['Authorization'] = API_KEY_MAQUINA_REAL;
                const response = await fetch(URL_MAQUINA_PRINCIPAL, { ...fetchOptions, signal: controller.signal });
                clearTimeout(timeout);
                if (!response.ok) throw new Error(`Máquina principal falhou: ${response.status}`);
                respostaMaquina = await response.json();
            } catch (err) { // Falha na Principal -> Tenta Virtual
                clearTimeout(timeout);
                console.warn(`   ⚠️ MÁQUINA PRINCIPAL FALHOU. Redirecionando p/ VM...`);
                // (Lógica de fallback para VM)
                try { 
                    delete fetchOptions.headers['Authorization'];
                    const vmResponse = await fetch(URL_MAQUINA_VIRTUAL, fetchOptions);
                    if (!vmResponse.ok) throw new Error(`Máquina virtual falhou: ${vmResponse.status}`);
                    respostaMaquina = await vmResponse.json();
                } catch (vmErr) {
                    throw vmErr;
                }
            }
            
            // Resposta da máquina (ex: { id: 'maquina-xyz-123', ... })
            respostasDaMaquina.push(respostaMaquina);
            
            const machineId = respostaMaquina?.id;
            if (machineId) {
                // --- SPRINT 03: SALVA O ID DA MÁQUINA NO BANCO ---
                // Isso associa nosso item_id com o machine_id
                console.log(`[PASSO 4.5/5] 🔗 Associando item BD ${itemSalvo.item_id} com Machine ID ${machineId}`);
                await client.query(
                    `UPDATE itens_pedido SET machine_id = $1 WHERE item_id = $2`,
                    [machineId, itemSalvo.item_id]
                );
                idsDaMaquinaParaCliente.push(machineId); // Envia o ID da máquina para o cliente
            }
        }
        // Fim do loop for

        await client.query('COMMIT');
        console.log("   ✅ Transação banco concluída (COMMIT).");

        console.log("\n[PASSO 5/5] 🤖 Gerando recomendação de IA...");
        const recomendacao = await getRecomendacaoIA(pedido.itens); 

        // Responde ao cliente com os IDs da MÁQUINA
        res.status(201).json({ 
            message: "Pedido salvo!", 
            pedido: pedidoSalvo, 
            idsDaMaquina: idsDaMaquinaParaCliente, // Ex: ['maquina-xyz-123', 'maquina-xyz-456']
            recomendacao: recomendacao
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("\n❌ ERRO GERAL PEDIDO (ROLLBACK):", err.message);
        res.status(500).json({ error: "Erro interno", details: err.message });
    } finally {
        client.release();
        console.log("\n--- ✅ PROCESSAMENTO PEDIDO CONCLUÍDO ✅ ---\n");
    }
});

// --- ROTA DE HISTÓRICO  ---
app.get('/api/pedidos/cliente/:clienteId', async (req, res) => {
    const { clienteId } = req.params;

    if (!clienteId) {
        return res.status(400).json({ error: 'ID do cliente não fornecido.' });
    }

    try {
        const query = `
            SELECT 
                p.pedido_id,
                p.data_pedido,
                p.valor_total,
                p.status,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'item_id', ip.item_id,
                            'nome_item', ip.nome_item,
                            'quantidade', ip.quantidade,
                            'valor_unitario', ip.valor_unitario,
                            'valor_total', ip.valor_total
                        )
                    ) FILTER (WHERE ip.item_id IS NOT NULL),
                '[]'::json
                ) AS itens
            FROM pedidos p
            LEFT JOIN itens_pedido ip ON p.pedido_id = ip.pedido_id
            WHERE p.cliente_id = $1
            GROUP BY p.pedido_id
            ORDER BY p.data_pedido DESC;
        `;

        const resultado = await pool.query(query, [clienteId]);

        res.json(resultado.rows);

    } catch (err) {
        console.error(`[HISTÓRICO] Erro cliente ${clienteId}:`, err.message);
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
});




// Esta rota é chamada PELA MÁQUINA, não pelo nosso frontend
app.post('/api/webhook/status', async (req, res) => {
    // O body esperado da máquina (ex: { itemId: 101, status: 'COMPLETED', slot: 'Slot:05', machineId: 'maquina-xyz-123' })
    const { itemId, status, slot, machineId } = req.body;
console.log(`Webhook recebido com body:`, req.body);
    console.log(`\n--- 🔔 WEBHOOK RECEBIDO 🔔 ---`);
    console.log(`   ➡️ Body:`, req.body);

    // Precisamos de um ID para atualizar o banco
    const idParaBusca = itemId || (machineId ? machineId : null);
    const tipoDeId = itemId ? 'item_id' : (machineId ? 'machine_id' : null);

    if (!idParaBusca || !tipoDeId) {
        console.warn(`   ⚠️ Webhook recebido sem 'itemId' ou 'machineId'. Impossível processar.`);
        return res.status(400).json({ error: "Missing itemId or machineId" });
    }
    
    // O slot simulado (caso a máquina não envie, mas o status seja 'COMPLETED')
    let slotFinal = slot;
    if ((status === 'COMPLETED' || status === 'Pronto') && !slot) {
        const numeroSlot = Math.floor(Math.random() * 12) + 1;
        const numeroFormatado = String(numeroSlot).padStart(2, '0');
        slotFinal = `Slot:${numeroFormatado}`;
        console.log(`   ➡️ Status 'COMPLETED' sem slot. Gerando slot mockado: ${slotFinal}`);
    }

    try {
        const query = `
            UPDATE itens_pedido 
            SET status_maquina = $1, slot_entrega = $2 
            WHERE ${tipoDeId} = $3
            RETURNING pedido_id, item_id, nome_item, status_maquina, slot_entrega;`;
        const result = await pool.query(query, [status, slotFinal, idParaBusca]);

        if (result.rowCount > 0) {
            console.log(`   ✅ SUCESSO: Item ${result.rows[0].item_id} (${result.rows[0].nome_item}) atualizado para '${status}' no slot '${slotFinal}'`);
            
            // TODO Opcional: Verificar se todos os itens do pedido_id estão prontos
            // e atualizar a tabela 'pedidos' principal.

            res.status(200).json({ message: "Atualização recebida com sucesso." });
        } else {
            console.warn(`   ⚠️ AVISO: Webhook recebido para ${tipoDeId} '${idParaBusca}', mas nenhum item foi encontrado no BD.`);
            res.status(404).json({ error: "Item not found in database" });
        }
    } catch (err) {
        console.error(`   ❌ ERRO AO PROCESSAR WEBHOOK para ${tipoDeId} '${idParaBusca}':`, err.message);
        res.status(500).json({ error: "Erro interno no servidor ao processar webhook" });
    }
    console.log(`--- 🔔 FIM WEBHOOK 🔔 ---\n`);
});


app.get('/api/pedidos/status/:machineId', async (req, res) => {
    const { machineId } = req.params;
    if (!machineId) {
        return res.status(400).json({ error: 'ID da máquina não fornecido.' });
    }

    console.log(`[STATUS BD] Consultando BD local pelo machineId: ${machineId}`);

    try {
        // Busca o status no nosso banco de dados
        const query = `
            SELECT nome_item, status_maquina, slot_entrega 
            FROM itens_pedido 
            WHERE machine_id = $1
        `;
        const result = await pool.query(query, [machineId]);

        if (result.rows.length === 0) {
            console.warn(`[STATUS BD] Nenhum item encontrado no BD para machineId: ${machineId}`);
            return res.status(404).json({ error: 'Nenhum item encontrado para este ID da máquina.' });
        }

        const item = result.rows[0];

        return res.status(200).json({
            message: 'Status encontrado.',
            status: item.status_maquina,
            slot: item.slot_entrega || null,
            nomeItem: item.nome_item
        });

    } catch (err) {
        console.error(`[STATUS BD] Erro ao buscar status do machineId ${machineId}:`, err);
        return res.status(500).json({ error: 'Erro interno ao consultar status.' });
    }
    
});



// --- SPRINT 03: ROTA PARA CONFIRMAR ENTREGA E LIBERAR ESTOQUE ---
app.post('/api/pedidos/confirmar_entrega', async (req, res) => {
    // Frontend envia o ID da máquina do item que foi pego
    const { machine_id } = req.body; 
    if (!machine_id) {
        return res.status(400).json({ error: 'machine_id não fornecido.' });
    }

    console.log(`\n--- 🏁 CONFIRMAR ENTREGA 🏁 ---`);
    console.log(`   ➡️ Recebido machine_id: ${machine_id}`);

    try {
        // 1. Encontrar o slot associado a este item no BD
        const itemQuery = `
            SELECT slot_entrega 
            FROM itens_pedido 
            WHERE machine_id = $1 AND (status_maquina = 'COMPLETED' OR status_maquina = 'Pronto')
        `;
        const itemResult = await pool.query(itemQuery, [machine_id]);

        if (itemResult.rows.length === 0) {
            console.warn(`   ⚠️ Nenhum item pronto ('COMPLETED'/'Pronto') encontrado para machine_id ${machine_id}. Talvez já foi entregue?`);
            return res.status(404).json({ error: 'Nenhum item pronto encontrado para este ID.' });
        }

        const slot = itemResult.rows[0].slot_entrega; // Ex: "Slot:05" ou "Slot:12"
        if (!slot || !slot.includes(':')) {
            console.warn(`   ⚠️ Item ${machine_id} está pronto, mas não tem um slot (ex: 'Slot:05') associado.`);
            return res.status(400).json({ error: 'Item pronto, mas sem slot de retirada definido.' });
        }

        // Extrai o ID do slot (ex: "05" de "Slot:05")
        const idDoSlotParaLiberar = slot.split(':').pop(); 
        console.log(`   ➡️ Item pronto no slot: ${slot}. ID para liberar: ${idDoSlotParaLiberar}`);

        // 2. Chamar a API de Estoque para liberar a posição (DELETE)
        const urlAlvo = `${URL_ESTOQUE_PRINCIPAL}/${idDoSlotParaLiberar}`;
        const headers = { 'Authorization': API_KEY_MAQUINA_REAL };

        try {
            console.log(`   ➡️ Enviando DELETE para ${urlAlvo}...`);
            const response = await fetch(urlAlvo, { method: 'DELETE', headers: headers });

            if (!response.ok) {
                // Não para o processo se o delete falhar, mas avisa
                const errorData = await response.json();
                console.error(`   ❌ ERRO AO LIBERAR ESTOQUE (Slot ${idDoSlotParaLiberar}): ${errorData.error || response.statusText}`);
                // Decide se quer parar aqui ou continuar e apenas marcar como entregue
                // throw new Error(errorData.error || `Máquina real falhou (DELETE): ${response.status}`);
            } else {
                const data = await response.json();
                console.log(`   ✅ SUCESSO: Estoque (Slot ${idDoSlotParaLiberar}) liberado. Mensagem: ${data.message}`);
            }
        } catch (estoqueErr) {
            console.error(`   ❌ FALHA CRÍTICA AO TENTAR LIBERAR ESTOQUE (Slot ${idDoSlotParaLiberar}):`, estoqueErr.message);
            // Mesmo com falha aqui, vamos marcar como entregue no nosso sistema
        }

        // 3. Atualizar o status do item no nosso BD para "Entregue"
        console.log(`   ➡️ Atualizando status no BD para 'Entregue' (Machine ID: ${machine_id})...`);
        await pool.query(
            `UPDATE itens_pedido SET status_maquina = 'Entregue' WHERE machine_id = $1`,
            [machine_id]
        );
        console.log(`   ✅ Item ${machine_id} marcado como 'Entregue'.`);

        res.status(200).json({ message: "Entrega confirmada e posição de estoque liberada." });

    } catch (err) {
        console.error(`[CONFIRMAR ENTREGA] Erro fatal para machine_id ${machine_id}:`, err.message);
        res.status(500).json({ error: 'Erro interno ao confirmar entrega.', details: err.message });
    }
    console.log(`--- 🏁 FIM ENTREGA 🏁 ---\n`);
});


// --- ROTAS DE ESTOQUE (Sem alterações) ---

// GET /api/estoque (Resumo)
app.get('/api/estoque', async (req, res) => {
    console.log(`[PROXY ESTOQUE] Recebida consulta de estoque...`);
    let urlEstoque = URL_ESTOQUE_PRINCIPAL;
    let headers = { 'Authorization': API_KEY_MAQUINA_REAL };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MAQUINA_MS);
        let response = await fetch(urlEstoque, { method: 'GET', headers: headers, signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Máquina real falhou: ${response.status}`);
        const estoqueCompleto = await response.json(); 
        const contagem = contarEstoque(estoqueCompleto);
        res.json(contagem);
    } catch (err) {
        console.warn(`[PROXY ESTOQUE] Falha na Máquina Principal (${err.message}). Tentando Máquina Virtual...`);
        try {
            const vmResponse = await fetch(URL_ESTOQUE_VIRTUAL, { method: 'GET' }); 
            if (!vmResponse.ok) throw new Error(`Máquina virtual também falhou: ${vmResponse.status}`);
            const estoqueVM = await vmResponse.json(); 
            res.json(estoqueVM); 
        } catch (vmErr) {
            console.error(`[PROXY ESTOQUE] FALHA CRÍTICA: Ambas as máquinas falharam.`);
            res.status(500).json({ error: "Erro ao consultar o estoque em ambas as máquinas." });
        }
    }
});

// PUT /api/estoque/:id (Atualizar)
app.put('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    const bodyRecebidoDoReact = req.body; 
    console.log(`[PROXY ESTOQUE PUT] Recebida atualização para Posição ID: ${id}`);
    const payloadParaMaquinaReal = bodyRecebidoDoReact;
    const urlAlvo = `${URL_ESTOQUE_PRINCIPAL}/${id}`;
    const headers = { 'Authorization': API_KEY_MAQUINA_REAL, 'Content-Type': 'application/json' };
    try {
        const response = await fetch(urlAlvo, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payloadParaMaquinaReal) 
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Máquina real falhou (PUT): ${response.status} - ${errorText}`);
        }
        const data = await response.json(); 
        res.json(data); 
    } catch (err) {
        console.warn(`[PROXY ESTOQUE PUT] Falha na Máquina Principal (${err.message}).`);
        res.status(500).json({ error: "Erro ao atualizar item no estoque.", details: err.message });
    }
});

// DELETE /api/estoque/:id (Liberar)
app.delete('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`[PROXY ESTOQUE DELETE] Recebida requisição para liberar Posição ID: ${id}`);
    const urlAlvo = `${URL_ESTOQUE_PRINCIPAL}/${id}`;
    const headers = { 'Authorization': API_KEY_MAQUINA_REAL };
    try {
        const response = await fetch(urlAlvo, { method: 'DELETE', headers: headers });
        if (!response.ok) {
            const errorData = await response.json(); 
            console.error(`[PROXY ESTOQUE DELETE] Erro da API: ${errorData.error || response.statusText}`);
            throw new Error(errorData.error || `Máquina real falhou (DELETE): ${response.status}`);
        }
        const data = await response.json(); 
        res.json(data);
    } catch (err) {
        console.warn(`[PROXY ESTOQUE DELETE] Falha na Máquina Principal (${err.message}).`);
        res.status(500).json({ error: "Erro ao liberar posição no estoque.", details: err.message });
    }
});

// GET /api/estoque/detalhes (Lista Completa)
const tradutorNumeroParaString = { 1: 'preto', 2: 'vermelho', 3: 'azul' };
app.get('/api/estoque/detalhes', async (req, res) => {
    console.log(`[PROXY ESTOQUE DETALHES] Recebida consulta de detalhes...`); 
    let urlEstoque = URL_ESTOQUE_PRINCIPAL;
    let headers = { 'Authorization': API_KEY_MAQUINA_REAL };
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MAQUINA_MS);
        let response = await fetch(urlEstoque, { method: 'GET', headers: headers, signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Máquina real falhou: ${response.status}`);
        const estoqueCompleto = await response.json();
        let estoqueTraduzido = [];
        if (Array.isArray(estoqueCompleto)) { 
            estoqueTraduzido = estoqueCompleto.map(slot => ({
                ...slot, 
                cor: tradutorNumeroParaString[slot.cor] || slot.cor 
            }));
        } else {
             console.warn(`[PROXY ESTOQUE DETALHES] A Máquina Real não retornou um array.`);
        }
        res.json(estoqueTraduzido); 
    } catch (err) {
        console.warn(`[PROXY ESTOQUE DETALHES] Falha na Máquina Principal (${err.message}). Tentando VM...`);
        try {
            const vmResponse = await fetch(URL_ESTOQUE_VIRTUAL, { method: 'GET' });
            if (!vmResponse.ok) throw new Error(`Máquina virtual também falhou: ${vmResponse.status}`);
            const estoqueVM = await vmResponse.json();
            let estoqueVMTraduzido = [];
            if (Array.isArray(estoqueVM)) {
                estoqueVMTraduzido = estoqueVM.map(slot => ({
                    ...slot,
                    cor: tradutorNumeroParaString[slot.cor] || slot.cor
                }));
            } else {
                 console.warn(`[PROXY ESTOQUE DETALHES] A Máquina Virtual não retornou um array.`);
            }
            res.json(estoqueVMTraduzido);
        } catch (vmErr) {
            console.error(`[PROXY ESTOQUE DETALHES] FALHA CRÍTICA: Ambas as máquinas falharam.`);
            res.status(500).json({ error: "Erro ao consultar o estoque em ambas as máquinas." });
        }
    }
});


// --- Inicializa o servidor ---
app.listen(PORT, () => {
    console.log(` ✅ Servidor Pizzaria rodando na porta ${PORT}`);
    console.log(` 📞 Endpoint de Pedidos: http://localhost:${PORT}/api/pedidos`);
    console.log(` 📊 Endpoint de Status (Agora lê o BD): http://localhost:${PORT}/api/pedidos/status/:machineId`);
    console.log(` 🔔 Endpoint de Webhook (A Máquina chama aqui): http://localhost:${PORT}/api/webhook/status`);
    console.log(` 🏁 Endpoint de Confirmação: http://localhost:${PORT}/api/pedidos/confirmar_entrega`) ; 
    console.log(` 📜 Endpoint de Histórico: http://localhost:${PORT}/api/pedidos/cliente/:clienteId`);
    console.log(` 📦 Endpoints de Estoque: /api/estoque, /api/estoque/detalhes, etc.`);
    console.log(`\n ⚠️ Lembre-se: O callback URL (MINHA_URL_DE_CALLBACK) deve ser um IP PÚBLICO para a máquina funcionar!`);
});