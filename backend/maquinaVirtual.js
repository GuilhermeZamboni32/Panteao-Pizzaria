import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// ---------------- MAQUINA VIRTUAL ---------------- //
const pedidosNaMaquina = new Map();

// Estoque inicial (Mock)
let estoqueFalso = [
    { pos: 1, cor: "preto", op: null },
    { pos: 2, cor: "preto", op: null },
    { pos: 3, cor: "vermelho", op: "pedido-abc" },
    { pos: 4, cor: "azul", op: null },
    { pos: 5, cor: "vermelho", op: null },
    { pos: 6, cor: "azul", op: "pedido-xyz" }
];

app.use(cors());
app.use(express.json());

console.log("🤖 Máquina Virtual Inicializada!");
console.log("--------------------------------");


// =====================================================
// 1. RECEBER PEDIDO
// =====================================================
app.post('/queue/items', (req, res) => {
    const payload = req.body;

    const id = `maquina-${Date.now()}`;
    pedidosNaMaquina.set(id, {
        payload,
        status: "Recebido (VM)",
        slot: null
    });

    console.log(`📥 Pedido recebido na VM: ${id}`);

    // Troca de status em 10 segundos
    setTimeout(() => {
        const pedido = pedidosNaMaquina.get(id);
        if (pedido && pedido.status !== "Pronto (VM)") {
            pedido.status = "Em preparação (VM)";
        }
    }, 10000);

    // Finaliza em 20 segundos
    setTimeout(() => {
        const pedido = pedidosNaMaquina.get(id);
        if (pedido) {
            pedido.status = "Pronto (VM)";
            pedido.slot = `SLOT-VM-${Math.floor(Math.random() * 10 + 1)}`;
        }
    }, 20000);

    res.status(200).json({
        id,
        status: "Recebido (VM)",
        slot: null,
        payload
    });
});

// =====================================================
// 2. CONSULTAR STATUS DO PEDIDO
// =====================================================
app.get('/queue/items/:id', (req, res) => {
    const { id } = req.params;
    const pedido = pedidosNaMaquina.get(id);

    if (!pedido) {
        return res.status(404).json({ status: "Pedido não encontrado na VM" });
    }

    res.json({
        id,
        status: pedido.status,
        slot: pedido.slot,
        payload: pedido.payload
    });
});

// =====================================================
// 3. ESTOQUE - RESUMO
// =====================================================
app.get('/estoque', (req, res) => {
    let massas = 0, molhoSalgado = 0, molhoDoce = 0;

    for (const item of estoqueFalso) {
        if (item.op === null) {
            if (item.cor === "preto") massas++;
            if (item.cor === "vermelho") molhoSalgado++;
            if (item.cor === "azul") molhoDoce++;
        }
    }

    res.json({ massas, molhoSalgado, molhoDoce });
});

// =====================================================
// 4. ESTOQUE - DETALHES
// =====================================================
app.get('/estoque/detalhes', (req, res) => {
    const detalhes = estoqueFalso.filter(s => s.cor || s.op);
    res.json(detalhes);
});

// =====================================================
// 5. ATUALIZAR POSIÇÃO DO ESTOQUE
// =====================================================
app.put('/estoque/:pos', (req, res) => {
    const pos = parseInt(req.params.pos);
    const { cor, op } = req.body;

    let item = estoqueFalso.find(p => p.pos === pos);

    if (item) {
        item.cor = cor ?? item.cor;
        item.op = op ?? null;
    } else {
        estoqueFalso.push({ pos, cor, op: op ?? null });
    }

    console.log(`🛠️ Estoque atualizado na pos ${pos}`);
    res.json(item);
});

// =====================================================
// 6. DELETAR POSIÇÃO DO ESTOQUE
// =====================================================
app.delete('/estoque/:pos', (req, res) => {
    const pos = parseInt(req.params.pos);
    const i = estoqueFalso.findIndex(p => p.pos === pos);

    if (i >= 0) {
        const removido = estoqueFalso.splice(i, 1)[0];
        console.log(`🧹 Posição ${pos} liberada.`);
        return res.json({ message: "Posição liberada", removido });
    }

    res.json({ message: "Posição já estava livre" });
});

// =====================================================
// 7. INICIAR VM
// =====================================================
app.listen(PORT, () => {
    console.log(`🔥 Máquina Virtual rodando na porta ${PORT}`);
    console.log(`   ➤ Pedidos: http://localhost:${PORT}/queue/items`);
    console.log(`   ➤ Estoque: http://localhost:${PORT}/estoque`);
    console.log(`   ➤ Detalhes: http://localhost:${PORT}/estoque/detalhes`);
});
