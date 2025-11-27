import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pool from '../serviceDatabase/db.js';

const app = express();
const PORT = 3002;

            /**##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##
             * ##                                                                                        ##
             * ##                                 ROTAS BLOBAIS                                          ##
             * ##                                                                                        ##
             * ##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##*/

//  CONSTANTES 
const BASE_URL = "http://52.72.137.244:3000"; // Base para todas as chamadas
const URL_MAQUINA_PRINCIPAL = `${BASE_URL}/queue/items`;
const URL_ESTOQUE_PRINCIPAL = `${BASE_URL}/estoque`;
const URL_EXPEDICAO = `${BASE_URL}/expedicao`; 

// Fallbacks e Virtuais
const URL_MAQUINA_VIRTUAL = "http://localhost:3000/queue/items";
const URL_ESTOQUE_VIRTUAL = "http://localhost:3000/estoque"; 
const URL_SERVICO_IA = 'http://localhost:5003/api/ai';

// URL PÚBLICA do seu servidor para o Webhook
const MINHA_URL_DE_CALLBACK = process.env.PUBLIC_CALLBACK_URL || 'http://52.72.137.244:3000/api/webhook/status';

const TIMEOUT_MAQUINA_MS = 3000;
const API_KEY_MAQUINA_REAL = process.env.MACHINE_API_KEY || 'CHAVE_SECRETA_DA_API';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());


const precos = { Broto: 25, Média: 30, Grande: 45 };

function contarEstoque(estoqueDaMaquina) {// conta quantos itens de cada tipo existem no estoque
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
    return { massas, molhoSalgado, molhoDoce };
}

async function getRecomendacaoIA(itensDoPedido) {// Chama o microserviço de IA para obter recomendação de bebida
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





            /**##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##
             * ##                                                                                        ##
             * ##                             ROTAS DE CRIAÇÃO DE PEDIDOS                                ##
             * ##                                                                                        ##
             * ##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##*/



app.post('/api/pedidos', async (req, res) => {
    const pedido = req.body;
    const client = await pool.connect();

    console.log(`\n\n--- 🍕 NOVO PEDIDO RECEBIDO [${new Date().toLocaleTimeString()}] 🍕 ---`);

    try {
        if (!pedido.itens || pedido.itens.length === 0) return res.status(400).json({ error: "Pedido sem itens" });
        if (!pedido.usuario || !pedido.usuario.id) return res.status(400).json({ error: "Pedido sem usuário válido" });

        await client.query('BEGIN');

        // 1. Salva Pedido Principal
        const valorTotal = pedido.itens.reduce((soma, item) => soma + (precos[item.tamanho] || 0), 0) + 5;
        const pedidoQuery = `INSERT INTO pedidos (cliente_id, valor_total, status) VALUES ($1, $2, $3) RETURNING *`;
        const novoPedidoResult = await client.query(pedidoQuery, [pedido.usuario.id, valorTotal, 'Recebido']);
        const pedidoSalvo = novoPedidoResult.rows[0];

        // 2. Prepara e Salva Itens
        const idsDaMaquinaParaCliente = [];
        
        for (const item of pedido.itens) {
            const nomeDoItem = item.nome_item || `Pizza ${item.tamanho}`;
            const valorUnitario = precos[item.tamanho] || 0;
            
            // Insere no BD Local
            const itemQuery = `
                INSERT INTO itens_pedido (pedido_id, nome_item, quantidade, valor_unitario, status_maquina) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING item_id, nome_item`;
            const itemResult = await client.query(itemQuery, [pedidoSalvo.pedido_id, nomeDoItem, 1, valorUnitario, 'Enviando...']);
            const itemSalvo = itemResult.rows[0];

            // Tradução e Envio para Middleware
            try {
                // Chama tradutor (Opcional, dependendo da sua arquitetura)
                const tradutorResponse = await fetch('http://localhost:3004/api/traduzir', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                const payloadTraduzido = tradutorResponse.ok ? await tradutorResponse.json() : { payload: { sku: "PADRAO", cor: "vermelho" } };

                // Monta Payload Oficial para o Middleware
                const payloadMiddleware = {
                    payload: {
                        ...payloadTraduzido.payload,
                        orderId: pedidoSalvo.pedido_id,
                        itemId: itemSalvo.item_id, 
                        nomeItem: itemSalvo.nome_item
                    },
                    callbackUrl: MINHA_URL_DE_CALLBACK, 
                    estoquePos: null 
                };

                // Envia para a Máquina
                const responseMaquina = await fetch(URL_MAQUINA_PRINCIPAL, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": API_KEY_MAQUINA_REAL
                    },
                    body: JSON.stringify(payloadMiddleware)
                });

                if (responseMaquina.ok) {
                    const dadosMaquina = await responseMaquina.json();
                    const machineId = dadosMaquina.id; 

                    // Atualiza nosso BD com o ID da Máquina
                    await client.query(
                        `UPDATE itens_pedido SET machine_id = $1 WHERE item_id = $2`,
                        [machineId, itemSalvo.item_id]
                    );
                    idsDaMaquinaParaCliente.push(machineId);
                } else {
                    console.error(`Erro ao enviar item para máquina: ${responseMaquina.status}`);
                }

            } catch (erroEnvio) {
                console.error(`Falha no envio do item ${itemSalvo.item_id}:`, erroEnvio.message);
            }
        }

        await client.query('COMMIT');
        
        // IA  não bloqueia resposta se falhar
        const recomendacao = await getRecomendacaoIA(pedido.itens); 

        res.status(201).json({ 
            message: "Pedido salvo e enviado para produção!", 
            pedido: pedidoSalvo, 
            idsDaMaquina: idsDaMaquinaParaCliente,
            recomendacao
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao processar pedido:", err);
        res.status(500).json({ error: "Erro interno" });
    } finally {
        client.release();
    }
});





            /**##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##
             * ##                                                                                        ##
             * ##                                ROTAS DE CALLBAKURL                                     ##
             * ##                                                                                        ##
             * ##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##*/



app.post('/api/webhook/status', async (req, res) => {
    console.log(`\n--- 🔔 WEBHOOK RECEBIDO 🔔 ---`);
    console.log(`➡️ Body Bruto:`, JSON.stringify(req.body, null, 2));

    const body = req.body;
    // 1. TENTATIVA DE RESGATE DE STATUS
    let idIdentificado = null;
    if (body.payload && body.payload.orderId) {
        idIdentificado = body.payload.orderId;
    } else if (body.machineId) {
        idIdentificado = body.machineId;
    } else if (body.id) { 
        idIdentificado = body.id;
    } else if (body._id) {
        idIdentificado = body._id;
    }

    // 2. TENTATIVA DE RESGATE DE STATUS
    const statusRecebido = body.status || body.stage;

    // 3. TENTATIVA DE RESGATE DE SLOT 
    const estoquePos = body.estoquePos || body.slot;

    if (!idIdentificado) {
        console.warn("⚠️ Webhook ignorado: Nenhum ID (orderId, machineId, id) identificado no JSON.");
        return res.status(400).json({ error: 'ID missing' });
    }

    // --- LÓGICA DE TRATAMENTO DE DADOS ---
    let statusParaBD = statusRecebido;
    let slotParaBD = estoquePos ? String(estoquePos) : null;
    
    // Verifica se precisa formatar o Slot
    if (slotParaBD && !slotParaBD.includes('Slot:')) {
        slotParaBD = `Slot:${slotParaBD.padStart(2, '0')}`;
    }

    // Se concluiu mas a máquina não mandou slot, inventamos um mockado
    if ((statusRecebido === 'COMPLETED' || statusRecebido === 'EXPEDICAO' || statusRecebido === 'Pronto') && !slotParaBD) {
        const numeroSlotMock = Math.floor(Math.random() * 12) + 1;
        slotParaBD = `Slot:${String(numeroSlotMock).padStart(2, '0')}`;
        console.log(`➡️ Status '${statusRecebido}' sem slot. Gerando slot mockado: ${slotParaBD}`);
    }

    console.log(`🛠️ Processando update para ID: ${idIdentificado} | Status: ${statusParaBD} | Slot: ${slotParaBD}`);

    try {
        // CORREÇÃO: Removido updated_at = NOW()
        const updateQuery = `
            UPDATE itens_pedido 
            SET status_maquina = $1, 
                slot_entrega = COALESCE($2, slot_entrega)
            WHERE machine_id = $3 OR item_id::text = $3 
            RETURNING item_id, status_maquina, slot_entrega`;
        
        const result = await pool.query(updateQuery, [statusParaBD, slotParaBD, idIdentificado]);

        if (result.rowCount > 0) {
            console.log(`✅ SUCESSO: Item atualizado no BD. (Item ID: ${result.rows[0].item_id})`);
            return res.status(200).send('OK');
        } else {
            console.warn(`⚠️ AVISO: O ID '${idIdentificado}' chegou no webhook, mas não foi encontrado na tabela 'itens_pedido'.`);
            // Retornamos 200 para a máquina não ficar tentando reenviar infinitamente, mesmo que não tenhamos achado
            return res.status(200).json({ warning: 'Item not found locally' });
        }
    } catch (err) {
        console.error("❌ ERRO DE BANCO:", err.message);
        return res.status(500).send('Internal Server Error');
    }
});




            /**##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##
             * ##                                                                                        ##
             * ##                           ROTAS DE Status do pedido                                    ##
             * ##                                                                                        ##
             * ##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##*/




// --- ROTA DE STATUS 
// --- ROTA DE STATUS (PRIORIDADE: REAL > MOCK) ---
app.get('/api/pedidos/status/:machineId', async (req, res) => {
    const { machineId } = req.params;
    const client = await pool.connect();

    console.log(`🔍 Status ID: ${machineId}`);

    try {
        // 1. Busca o que já temos no Banco de Dados (Para evitar sobrescrever)
        const checkQuery = await client.query('SELECT slot_entrega, status_maquina FROM itens_pedido WHERE machine_id = $1', [machineId]);
        
        if (checkQuery.rows.length === 0) {
            return res.status(404).json({ error: "Item não encontrado no banco local" });
        }

        let itemBanco = checkQuery.rows[0];
        let slotFinal = itemBanco.slot_entrega; // Começamos com o que já temos
        let statusParaGravar = itemBanco.status_maquina;

        // 2. Tenta consultar a Máquina Real
        let statusExterno = null;
        let slotExterno = null;

        try {
            const urlExterna = `http://52.72.137.244:3000/queue/items/${machineId}`;
            const responseMaquina = await fetch(urlExterna);
            
            if (responseMaquina.ok) {
                const dados = await responseMaquina.json();
                statusExterno = dados.status;
                statusParaGravar = statusExterno; // Atualizamos o status com o real

                // Tenta achar o slot na resposta da máquina (pode vir como 'slot', 'estoquePos', etc)
                const slotCru = dados.slot || dados.estoquePos;
                
                if (slotCru) {
                    // Formata para garantir que seja "Slot:XX"
                    slotExterno = String(slotCru).includes('Slot:') 
                        ? slotCru 
                        : `Slot:${String(slotCru).padStart(2, '0')}`;
                    console.log(`📡 Máquina Real respondeu com slot: ${slotExterno}`);
                }
            }
        } catch (erroRede) {
            console.warn(`⚠️ Falha ao conectar na máquina real: ${erroRede.message}. Usando lógica de fallback.`);
        }

        // 3. DECISÃO DO SLOT (A Lógica Principal)
        if (!slotFinal) { 
            // Só procuramos um slot novo se o banco estiver vazio (NULL)
            
            if (slotExterno) {
                // CENÁRIO A: Máquina Real mandou slot -> Usamos ele!
                slotFinal = slotExterno;
                console.log(`✅ Usando Slot Real: ${slotFinal}`);
            } 
            else if (statusParaGravar === 'COMPLETED' || statusParaGravar === 'Pronto' || statusParaGravar === 'EXPEDICAO') {
                // CENÁRIO B: Máquina não mandou (ou falhou), mas tá pronto -> Usamos MOCK!
                const numeroSlotMock = Math.floor(Math.random() * 12) + 1;
                slotFinal = `Slot:${String(numeroSlotMock).padStart(2, '0')}`;
                console.log(`🎲 Usando Slot Mock (Fallback): ${slotFinal}`);
            }
        }

        // 4. Atualiza o Banco de Dados com a decisão
        const updateQuery = `
            UPDATE itens_pedido 
            SET status_maquina = $1,
                slot_entrega = $2
            WHERE machine_id = $3 
            RETURNING status_maquina, slot_entrega, nome_item
        `;

        const result = await client.query(updateQuery, [statusParaGravar, slotFinal, machineId]);
        const itemAtualizado = result.rows[0];

        // 5. Resposta para o Frontend
        res.json({
            status: itemAtualizado.status_maquina,
            slot: itemAtualizado.slot_entrega,
            nomeItem: itemAtualizado.nome_item
        });

    } catch (err) {
        console.error("❌ Erro rota status:", err.message);
        res.status(500).json({ error: "Erro interno" });
    } finally {
        client.release();
    }
});


// --- ROTA CONFIRMAR ENTREGA (VERSÃO CORRIGIDA) ---
app.post('/api/pedidos/confirmar_entrega', async (req, res) => {
    const { machine_id } = req.body;

    if (!machine_id) return res.status(400).json({ error: 'machine_id obrigatório.' });

    console.log(`\n🏁 [ENTREGA] Iniciando baixa do item: ${machine_id}`);

    try {
        // 1. Tenta avisar a máquina real (Middleware)
        const urlLiberaExpedicao = `${URL_EXPEDICAO}/${machine_id}`;
        try {
            const responseMiddleware = await fetch(urlLiberaExpedicao, {
                method: 'DELETE',
                headers: { 'Authorization': API_KEY_MAQUINA_REAL }
            });
            if (!responseMiddleware.ok) {
                console.warn(`⚠️ [ENTREGA] Middleware reclamou, mas vamos seguir: ${responseMiddleware.status}`);
            }
        } catch (erroRede) {
            console.warn(`⚠️ [ENTREGA] Middleware offline, seguindo localmente.`);
        }

        // 2. Atualiza o banco (SEM A COLUNA updated_at)
        const updateQuery = `
            UPDATE itens_pedido 
            SET status_maquina = 'Entregue', 
                slot_entrega = NULL
            WHERE machine_id = $1
        `;
        
        await pool.query(updateQuery, [machine_id]);
            
        console.log(`✅ [ENTREGA] Sucesso! Item removido da tela.`);
        res.status(200).json({ message: "Entrega confirmada." });

    } catch (err) {
        // Esse log vai aparecer no seu terminal se der erro
        console.error(`❌ [ENTREGA] ERRO SQL:`, err.message);
        res.status(500).json({ error: err.message });
    }
});




            /**##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##
             * ##                                                                                        ##
             * ##                               ROTAS DE HISTÓRICO                                       ##
             * ##                                                                                        ##
             * ##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##*/




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






            /**##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##
             * ##                                                                                        ##
             * ##                                 ROTAS DE ESTOQUE                                       ##
             * ##                                                                                        ##
             * ##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##*/




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
    
    // --- TENTATIVA 1: MÁQUINA REAL ---
    try {
        const urlAlvo = `${URL_ESTOQUE_PRINCIPAL}/${id}`;
        const headers = { 'Authorization': API_KEY_MAQUINA_REAL, 'Content-Type': 'application/json' };
        
        const response = await fetch(urlAlvo, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(bodyRecebidoDoReact) 
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Máquina real falhou (PUT): ${response.status} - ${errorText}`);
        }

        const data = await response.json(); 
        res.json(data); 

    } catch (err) {
        console.warn(`[PROXY ESTOQUE PUT] Falha na Máquina Principal (${err.message}). Tentando Máquina Virtual...`);
        
        // --- TENTATIVA 2: MÁQUINA VIRTUAL (FALLBACK) ---
        try {
            // Assume que a URL da VM funciona igual: URL_BASE + /ID
            const urlAlvoVM = `${URL_ESTOQUE_VIRTUAL}/${id}`; 
            
            const vmResponse = await fetch(urlAlvoVM, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }, // VM geralmente não precisa de Auth Key específica
                body: JSON.stringify(bodyRecebidoDoReact)
            });

            if (!vmResponse.ok) {
                const errorTextVM = await vmResponse.text();
                throw new Error(`Máquina virtual também falhou: ${vmResponse.status} - ${errorTextVM}`);
            }

            const dataVM = await vmResponse.json();
            res.json(dataVM);

        } catch (vmErr) {
            console.error(`[PROXY ESTOQUE PUT] FALHA CRÍTICA: Ambas as máquinas falharam.`);
            res.status(500).json({ error: "Erro ao atualizar item no estoque em ambas as máquinas.", details: vmErr.message });
        }
    }
});

// DELETE /api/estoque/:id (Liberar)
app.delete('/api/estoque/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`[PROXY ESTOQUE DELETE] Recebida requisição para liberar Posição ID: ${id}`);
    
    // --- TENTATIVA 1: MÁQUINA REAL ---
    try {
        const urlAlvo = `${URL_ESTOQUE_PRINCIPAL}/${id}`;
        const headers = { 'Authorization': API_KEY_MAQUINA_REAL };

        const response = await fetch(urlAlvo, { method: 'DELETE', headers: headers });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); 
            throw new Error(errorData.error || `Máquina real falhou (DELETE): ${response.status}`);
        }
        
        const data = await response.json(); 
        res.json(data);

    } catch (err) {
        console.warn(`[PROXY ESTOQUE DELETE] Falha na Máquina Principal (${err.message}). Tentando Máquina Virtual...`);

        // --- TENTATIVA 2: MÁQUINA VIRTUAL (FALLBACK) ---
        try {
            const urlAlvoVM = `${URL_ESTOQUE_VIRTUAL}/${id}`;
            
            const vmResponse = await fetch(urlAlvoVM, { method: 'DELETE' });

            if (!vmResponse.ok) {
                throw new Error(`Máquina virtual também falhou (DELETE): ${vmResponse.status}`);
            }

            const dataVM = await vmResponse.json();
            res.json(dataVM);

        } catch (vmErr) {
            console.error(`[PROXY ESTOQUE DELETE] FALHA CRÍTICA: Ambas as máquinas falharam.`);
            res.status(500).json({ error: "Erro ao liberar posição no estoque.", details: vmErr.message });
        }
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




            /**##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##
             * ##                                                                                        ##
             * ##                                   ROTAS DE ENDPOINT                                    ##
             * ##                                                                                        ##
             * ##||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||##*/



app.listen(PORT, () => {
    console.log(` ✅ Servidor Pizzaria rodando na porta ${PORT}`);
    console.log(` 📞 Endpoint de Pedidos: http://localhost:${PORT}/api/pedidos`);
    console.log(` 📊 Endpoint de Status: http://localhost:${PORT}/api/pedidos/status/:machineId`);
    console.log(` 🔔 Endpoint de Webhook: http://localhost:${PORT}/api/webhook/status`);
    console.log(` 🏁 Endpoint de Confirmação: http://localhost:${PORT}/api/pedidos/confirmar_entrega`) ; 
    console.log(` 📜 Endpoint de Histórico: http://localhost:${PORT}/api/pedidos/cliente/:clienteId`);
    console.log(` 📦 Endpoints de Estoque: /api/estoque, /api/estoque/detalhes, etc.`);
});