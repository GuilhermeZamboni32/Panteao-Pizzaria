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
const URL_ESTOQUE_VIRTUAL = "http://localhost:3000/estoque"; // Para testes

// <-- 1. ADICIONE A URL DO SERVIÇO DE IA
const URL_SERVICO_IA = 'http://localhost:5003/api/ai'; // O servidor do seu colega

const TIMEOUT_MAQUINA_MS = 3000;
const API_KEY_MAQUINA_REAL = process.env.MACHINE_API_KEY || 'CHAVE_SECRETA_DA_API';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// (Aqui devem estar suas funções 'precos' e 'contarEstoque', etc.)
// ...
const precos = { Broto: 25, Média: 30, Grande: 45 };

function contarEstoque(estoqueDaMaquina) {
    // ... (sua função de contarEstoque)
    let massas = 0;
    let molhoSalgado = 0;
    let molhoDoce = 0;

    if (!Array.isArray(estoqueDaMaquina)) {
        return { massas, molhoSalgado, molhoDoce };
    }

    for (const item of estoqueDaMaquina) {
        if (item.op === null) {
            if (item.cor == 1 || item.cor === 'preto') {
                massas++;
            } else if (item.cor == 2) { 
                molhoSalgado++;
            } else if (item.cor == 3) { 
                molhoDoce++;
            }
        }
    }
    return { massas, molhoSalgado, molhoDoce };
}


// <-- 2. ADICIONE A FUNÇÃO QUE CHAMA A IA
/**
 * Pega a lista de itens e gera uma recomendação de acompanhamento
 * USANDO O MICROSERVIÇO DE IA (porta 5003)
 */


async function getRecomendacaoIA(itensDoPedido) {
    try {
        // Cria uma lista de nomes de pizza para a IA
        const listaItens = itensDoPedido.map(item => 
            item.nome_item || `Pizza ${item.tamanho}`
        ).join(', ');

        // Cria o prompt
        const prompt = `
            Você é um assistente da Panteão Pizzaria, e você se chama "Dionísio". 
            Sua tarefa é recomendar UMA bebida para acompanhar o pedido de pizza.

            **REGRAS IMPORTANTES:**
            1.  **FOCO TOTAL:** Recomende apenas bebidas comuns e populares no Brasil.

            2.  **PERMITIDO:** Refrigerantes (como Coca-Cola, Coca-Cola Zero, Guaraná, Fanta), 
                               Cervejas populares (como Skol, Brahma, Heineken), e 
                               sucos (suco de laranja, suco de morango, suco de uva).

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

        // Chama o SEU SERVIÇO DE IA (porta 5003)
        const responseIA = await fetch(URL_SERVICO_IA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: prompt }) // Envia o prompt como 'message'
        });

        if (!responseIA.ok) {
            throw new Error('O microserviço de IA (porta 5003) falhou.');
        }

        const data = await responseIA.json();
        
        // O servidor do seu colega retorna { reply: "..." }
        return data.reply; 

    } catch (err) {
        console.error("Erro ao chamar o microserviço de IA:", err.message);
        return null; // Retorna null se a IA falhar
    }
}


// --- ROTA POST /api/pedidos ---
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
        const valorTotalCalculado = pedido.itens.reduce((soma, item) => soma + (precos[item.tamanho] || 0), 0) + 5; // + frete

        const pedidoQuery = `INSERT INTO pedidos (cliente_id, valor_total, status) VALUES ($1, $2, $3) RETURNING *`;
        const novoPedidoResult = await client.query(pedidoQuery, [clienteId, valorTotalCalculado, 'Recebido']);
        const pedidoSalvo = novoPedidoResult.rows[0];
        console.log(`   ✅ Pedido principal salvo (ID BD: ${pedidoSalvo.pedido_id})`);

        // Salva os itens do pedido
        console.log("[PASSO 3/4] 💾 Inserindo itens...");
        const itensSalvos = [];
        for (const item of pedido.itens) {
            const nomeDoItem = item.nome_item || `Pizza ${item.tamanho} (${(item.ingredientes || []).map(i => i.nome).join(', ')})`;
            const valorUnitario = (item.origem === 'historico' ? item.preco : (precos[item.tamanho] || 0));
            const itemQuery = `INSERT INTO itens_pedido (pedido_id, nome_item, quantidade, valor_unitario) VALUES ($1, $2, $3, $4) RETURNING item_id, nome_item`;
            const itemResult = await client.query(itemQuery, [pedidoSalvo.pedido_id, nomeDoItem, 1, valorUnitario]);
            itensSalvos.push(itemResult.rows[0]);
        }
        console.log(`   ✅ ${itensSalvos.length} itens salvos no banco.`);

        // Envia cada item (pizza) para a máquina
        console.log("\n[PASSO 4/4] 🚀 Enviando para produção...");
        const promessasDeEnvio = pedido.itens.map(async (item, index) => {
            const itemSalvo = itensSalvos[index];

            // Chama o microserviço de tradução
            const tradutorResponse = await fetch('http://localhost:3004/api/traduzir', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });

            if (!tradutorResponse.ok) {
                throw new Error('Falha no microserviço de tradução');
            }

            const payloadTraduzido = await tradutorResponse.json();
            payloadTraduzido.payload.orderId = pedidoSalvo.pedido_id;
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
                        throw vmErr;
                    }
                } else {
                    throw err;
                }
            }
        });

        const respostasDaMaquina = await Promise.all(promessasDeEnvio);
        await client.query('COMMIT');
        console.log("   ✅ Transação banco concluída (COMMIT).");

        
        console.log("IA: Gerando recomendação de acompanhamento...");
        const recomendacao = await getRecomendacaoIA(pedido.itens); 

        const idsValidosDaMaquina = respostasDaMaquina.filter(r => r && r.id).map(r => r.id);
        
        // Adiciona a 'recomendacao' à resposta JSON
        res.status(201).json({ 
            message: "Pedido salvo!", 
            pedido: pedidoSalvo, 
            idsDaMaquina: idsValidosDaMaquina,
            recomendacao: recomendacao // <-- Nova chave adicionada
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
// --- ROTA GET /api/pedidos/cliente/:clienteId ---
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

// --- ROTA GET /api/pedidos/status/:machineId ---
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

        let statusData = await responseDaMaquina.json();
        console.log(`[PROXY STATUS] Resposta original da máquina para ${machineId}:`, statusData);

        let nomeItemDoBD = null;
        let itemIdDoPayload = null;

        if (statusData.payload && statusData.payload.itemId) {
            itemIdDoPayload = statusData.payload.itemId;
        } else if (isMaquinaVirtual && statusData.payload && statusData.payload.payload) {
            itemIdDoPayload = statusData.payload.payload.itemId;
        }

        if (itemIdDoPayload) {
            try {
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

        if (!nomeItemDoBD) {
            nomeItemDoBD = (statusData.payload && statusData.payload.nomeItem) ||
                (isMaquinaVirtual && statusData.payload && statusData.payload.payload && statusData.payload.payload.nomeItem);
        }

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

        res.json({
            id: statusData.id || machineId,
            status: statusData.status || "Desconhecido",
            slot: statusData.slot || null,
            nome_item: nomeItemDoBD || "Item não identificado"
        });

    } catch (err) {
        console.error(`[PROXY STATUS] Erro ao buscar status para ${machineId}:`, err.message);
        res.status(500).json({ error: 'Erro consulta status', details: err.message, status: 'Erro na consulta', slot: null, nome_item: 'Erro' });
    }
});





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




// --- ROTA GET /api/estoque (Resumo) ---
app.get('/api/estoque', async (req, res) => {
    console.log(`[PROXY ESTOQUE] Recebida consulta de estoque...`);

    let urlEstoque = URL_ESTOQUE_PRINCIPAL;
    let headers = { 'Authorization': API_KEY_MAQUINA_REAL };

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MAQUINA_MS);

        let response = await fetch(urlEstoque, {
            method: 'GET',
            headers: headers,
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Máquina real falhou: ${response.status}`);
        }

        const estoqueCompleto = await response.json();
        console.log(`[PROXY ESTOQUE] Sucesso na Máquina Principal. Itens recebidos: ${estoqueCompleto.length}`);

        const contagem = contarEstoque(estoqueCompleto);
        res.json(contagem);

    } catch (err) {
        console.warn(`[PROXY ESTOQUE] Falha na Máquina Principal (${err.message}). Tentando Máquina Virtual...`);
        try {
            const vmResponse = await fetch(URL_ESTOQUE_VIRTUAL, { method: 'GET' }); // Sem auth para VM
            if (!vmResponse.ok) {
                throw new Error(`Máquina virtual também falhou: ${vmResponse.status}`);
            }
            const estoqueVM = await vmResponse.json();
            console.log(`[PROXY ESTOQUE] Sucesso na Máquina Virtual.`);
            // --- CORREÇÃO --- Aplicar contagem na VM também
            const contagemVM = contarEstoque(estoqueVM);
            res.json(contagemVM); 

        } catch (vmErr) {
            // --- LOG DE ERRO MELHORADO ---
            console.error(`[PROXY ESTOQUE] FALHA CRÍTICA: Ambas as máquinas falharam.`);
            console.error(`   > Erro Máquina Principal: ${err.message}`);
            console.error(`   > Erro Máquina Virtual: ${vmErr.message}`);
            res.status(500).json({ error: "Erro ao consultar o estoque em ambas as máquinas." });
        }
    }
});


/// --- ROTA PUT PARA ATUALIZAR ITEM NO ESTOQUE (CORRIGIDA) ---
app.put('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    const bodyRecebidoDoReact = req.body; 

    console.log(`[PROXY ESTOQUE PUT] Recebida atualização para Posição ID: ${id}`);
    console.log(`   -> Dados do React:`, bodyRecebidoDoReact);

    // =================================================================
    // !!! INÍCIO DA CORREÇÃO !!!
    // Traduz o nome da cor (string) do React para o ID (número) da Máquina
    // =================================================================
    const tradutorCorParaNumero = {
        'preto': 1,     // 1 = Massa
        'vermelho': 2,  // 2 = Molho Salgado
        'azul': 3       // 3 = Molho Doce
    };

    // Se a cor recebida for uma string (preto, vermelho, azul), traduza.
    // Se já for um número (ou outra coisa), mantenha como está.
    const corTraduzida = tradutorCorParaNumero[bodyRecebidoDoReact.cor] || bodyRecebidoDoReact.cor;

    // Este é o payload que a MÁQUINA REAL vai receber
    const payloadParaMaquinaReal = {
        ...bodyRecebidoDoReact, // Inclui 'op' e outros campos
        cor: corTraduzida       // Usa a cor traduzida (ex: 1)
    };
    
    console.log(`   -> Dados Traduzidos (Enviando para Máquina Real):`, payloadParaMaquinaReal);
    // =================================================================
    // !!! FIM DA CORREÇÃO !!!
    // =================================================================

    // Define a URL e os headers para a máquina principal
    const urlAlvo = `${URL_ESTOQUE_PRINCIPAL}/${id}`;
    const headers = {
        'Authorization': API_KEY_MAQUINA_REAL,
        'Content-Type': 'application/json'
    };

    try {
        // Tenta enviar o PUT para a Máquina Principal
        const response = await fetch(urlAlvo, {
            method: 'PUT',
            headers: headers,
            // Envia o payload traduzido
            body: JSON.stringify(payloadParaMaquinaReal) 
        });

        if (!response.ok) {
            // Se a máquina real falhar, joga um erro
            const errorText = await response.text();
            throw new Error(`Máquina real falhou (PUT): ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json(); // Lê a resposta JSON da máquina
        console.log(`[PROXY ESTOQUE PUT] Sucesso na Máquina Principal.`);
        res.json(data); // Envia a resposta de sucesso de volta para o React

    } catch (err) {
        console.warn(`[PROXY ESTOQUE PUT] Falha na Máquina Principal (${err.message}).`);
        // (Aqui você pode adicionar um fallback para a VM se necessário)
        res.status(500).json({ error: "Erro ao atualizar item no estoque.", details: err.message });
    }
});

// --- NOVA ROTA DELETE ADICIONADA ---
// --- ROTA DELETE PARA LIBERAR ITEM DO ESTOQUE ---
app.delete('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`[PROXY ESTOQUE DELETE] Recebida requisição para liberar Posição ID: ${id}`);

    // Define a URL e os headers para a máquina principal
    const urlAlvo = `${URL_ESTOQUE_PRINCIPAL}/${id}`;
    const headers = { 
        'Authorization': API_KEY_MAQUINA_REAL 
    };

    try {
        // Tenta enviar o DELETE para a Máquina Principal
        const response = await fetch(urlAlvo, {
            method: 'DELETE',
            headers: headers
        });

        if (!response.ok) {
            // Se a máquina real falhar, joga um erro
            const errorData = await response.json(); // Tenta ler a mensagem de erro da API
            console.error(`[PROXY ESTOQUE DELETE] Erro da API: ${errorData.error || response.statusText}`);
            throw new Error(errorData.error || `Máquina real falhou (DELETE): ${response.status}`);
        }

        const data = await response.json(); // Lê a resposta JSON da máquina (ex: { message: "Posição liberada..." })
        console.log(`[PROXY ESTOQUE DELETE] Sucesso na Máquina Principal.`);
        res.json(data); // Envia a resposta de sucesso de volta para o React

    } catch (err) {
        console.warn(`[PROXY ESTOQUE DELETE] Falha na Máquina Principal (${err.message}).`);
        // (Aqui você pode adicionar um fallback para a VM se necessário)
        res.status(500).json({ error: "Erro ao liberar posição no estoque.", details: err.message });
    }
});

// --- ROTA GET /api/estoque/detalhes (Lista Completa) ---
app.get('/api/estoque/detalhes', async (req, res) => {
    console.log(`[PROXY ESTOQUE DETALHES] Recebida consulta de detalhes...`); // Log diferente

    let urlEstoque = URL_ESTOQUE_PRINCIPAL;
    let headers = { 'Authorization': API_KEY_MAQUINA_REAL }; // Headers corretos

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MAQUINA_MS);

        let response = await fetch(urlEstoque, {
            method: 'GET',
            headers: headers,
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Máquina real falhou: ${response.status}`);
        }

        const estoqueCompleto = await response.json();
        console.log(`[PROXY ESTOQUE DETALHES] Sucesso na Máquina Principal. Itens: ${estoqueCompleto.length}`);

        res.json(estoqueCompleto); // Retorna a lista completa

    } catch (err) {
        console.warn(`[PROXY ESTOQUE DETALHES] Falha na Máquina Principal (${err.message}). Tentando VM...`);
        try {
            const vmResponse = await fetch(URL_ESTOQUE_VIRTUAL, { method: 'GET' });
            if (!vmResponse.ok) {
                throw new Error(`Máquina virtual também falhou: ${vmResponse.status}`);
            }
            const estoqueVM = await vmResponse.json();
            console.log(`[PROXY ESTOQUE DETALHES] Sucesso na Máquina Virtual.`);

            res.json(estoqueVM); // Retorna a lista completa da VM

        } catch (vmErr) {
            console.error(`[PROXY ESTOQUE DETALHES] FALHA CRÍTICA: Ambas as máquinas falharam.`);
            console.error(` > Erro Máquina Principal: ${err.message}`);
            console.error(` > Erro Máquina Virtual: ${vmErr.message}`);
            res.status(500).json({ error: "Erro ao consultar o estoque em ambas as máquinas." });
        }
    }
});
// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor Pizzaria rodando na porta ${PORT}`);
    console.log(`   📞 Endpoint de Pedidos: http://localhost:${PORT}/api/pedidos`);
    console.log(`   📊 Endpoint de Status: http://localhost:${PORT}/api/pedidos/status/:machineId`);
    console.log(`   📜 Endpoint de Histórico: http://localhost:${PORT}/api/pedidos/cliente/:clienteId`);
    console.log(`   📦 Endpoint de Estoque (Resumo): http://localhost:${PORT}/api/estoque`);
    console.log(`   📋 Endpoint de Estoque (Detalhes): http://localhost:${PORT}/api/estoque/detalhes`);
});