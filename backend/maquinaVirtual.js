import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;
const pedidosNaMaquina = new Map();

// --- ESTOQUE FALSO (MOCK) ---
// Simula os 26 slots
let estoqueFalso = [
    { pos: 1, cor: "preto", op: null }, // Disponível
    { pos: 2, cor: "preto", op: null },
    { pos: 3, cor: "vermelho", op: "pedido-abc" }, // Ocupado
    { pos: 4, cor: "azul", op: null },
    { pos: 5, cor: "vermelho", op: null },
    { pos: 6, cor: "azul", op: "pedido-xyz" }, // Ocupado
];
// ------------------------------

app.use(cors());
app.use(express.json());

console.log('🤖 Máquina Virtual Pronta para Receber Pedidos!');
console.log('--------------------------------------------------');

// --- ROTAS DE PEDIDO (Sem alteração) ---
app.post('/queue/items', (req, res) => {
    const pedidoRecebidoPayload = req.body; 
    const idDoPedidoNaMaquina = `maquina-${Date.now()}`;
    pedidosNaMaquina.set(idDoPedidoNaMaquina, {
        payload: pedidoRecebidoPayload, 
        status: "Recebido (VM)",
        slot: null
    });
    // ... (setTimeout para status) ...
    setTimeout(() => {
        const pedido = pedidosNaMaquina.get(idDoPedidoNaMaquina);
        if (pedido && !pedido.status.toLowerCase().includes("pronto")) {
            pedido.status = "Em preparação (VM)";
        }
    }, 10000);
    setTimeout(() => {
        const pedido = pedidosNaMaquina.get(idDoPedidoNaMaquina);
        if (pedido) {
            pedido.status = "Pronto (VM)";
            pedido.slot = `SLOT-VM-${Math.floor(Math.random() * 5) + 1}`;
        }
    }, 20000);

    console.log(`✅ Pedido recebido na VM: ${idDoPedidoNaMaquina}`);
    res.status(200).json({
        id: idDoPedidoNaMaquina,
        status: 'Recebido (VM)',
        slot: null,
        payload: pedidoRecebidoPayload 
    });
});

app.get('/queue/items/:id', (req, res) => {
    const { id } = req.params;
    const pedido = pedidosNaMaquina.get(id);
    if (pedido) {
        res.json({
            id: id,
            status: pedido.status,
            slot: pedido.slot,
            payload: pedido.payload
        });
    } else {
        res.status(404).json({ status: 'Pedido não encontrado na VM', slot: null });
    }
});


// --- ROTAS DE ESTOQUE (MOCKS ATUALIZADOS) ---

// ROTA GET /estoque (Resumo)
app.get('/estoque', (req, res) => {
    console.log(`[VM ESTOQUE] Recebida consulta de (Resumo).`);
    // Conta o estoque falso
    let massas = 0, molhoSalgado = 0, molhoDoce = 0;
    for (const item of estoqueFalso) {
        if (item.op === null) { // Apenas disponíveis
            if (item.cor === 'preto') massas++;
            else if (item.cor === 'vermelho') molhoSalgado++;
            else if (item.cor === 'azul') molhoDoce++;
        }
    }
    res.json({ massas, molhoSalgado, molhoDoce });
});

// NOVA ROTA: GET /estoque/detalhes (Mock)
app.get('/estoque/detalhes', (req, res) => {
    console.log(`[VM ESTOQUE] Recebida consulta de (Detalhes).`);
    // Retorna a lista de slots preenchidos (ignora os totalmente vazios)
    const slotsPreenchidos = estoqueFalso.filter(slot => slot.cor !== null || slot.op !== null);
    res.json(slotsPreenchidos);
});

// NOVA ROTA: PUT /estoque/:pos (Mock)
app.put('/estoque/:pos', (req, res) => {
    const { pos } = req.params;
    const { cor, op } = req.body;
    console.log(`[VM ESTOQUE] Recebida requisição PUT para Posição: ${pos}`, req.body);

    const posNum = parseInt(pos);
    let item = estoqueFalso.find(p => p.pos === posNum);
    
    if (item) { // Atualiza item existente
        item.cor = cor;
        item.op = op || null;
    } else { // Adiciona novo item
        if (posNum > 0 && posNum <= 26) {
            item = { pos: posNum, cor, op: op || null };
            estoqueFalso.push(item);
        } else {
            return res.status(400).json({ error: "Posição inválida." });
        }
    }
    
    console.log(`   Estoque atualizado:`, item);
    res.status(200).json(item);
});

// NOVA ROTA: DELETE /estoque/:pos (Mock)
app.delete('/estoque/:pos', (req, res) => {
    const { pos } = req.params;
    const posNum = parseInt(pos);
    console.log(`[VM ESTOQUE] Recebida requisição DELETE para Posição: ${pos}`);

    let itemIndex = estoqueFalso.findIndex(p => p.pos === posNum);
    
    if (itemIndex > -1) {
        // Remove o item da lista (simulando "liberar")
        const itemRemovido = estoqueFalso.splice(itemIndex, 1)[0];
        console.log(`   Posição ${pos} liberada.`);
        res.status(200).json({ message: "Posição liberada com sucesso", ...itemRemovido, cor: null, op: null });
    } else {
        console.log(`   Posição ${pos} já estava livre.`);
        res.status(200).json({ message: "Posição já estava liberada" });
    }
});


app.listen(PORT, () => {
    console.log(`🔥 Máquina Virtual (servidor simulado) rodando na porta ${PORT}`);
    console.log(`   Endpoints de Pedido: http://localhost:${PORT}/queue/items`);
    console.log(`   Endpoint de Estoque (Resumo): http://localhost:${PORT}/estoque`);
    console.log(`   Endpoint de Estoque (Detalhes): http://localhost:${PORT}/estoque/detalhes`);
});