import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;
const pedidosNaMaquina = new Map();

app.use(cors());
app.use(express.json());

console.log('🤖 Máquina Virtual Pronta para Receber Pedidos!');
console.log('--------------------------------------------------');

// ROTA PARA RECEBER NOVOS PEDIDOS (POST)
app.post('/queue/items', (req, res) => {
    const pedidoRecebido = req.body;
    const idDoPedidoNaMaquina = `maquina-${Date.now()}`;

    // Status 1: Recebido (aciona cor AZUL no frontend)
    pedidosNaMaquina.set(idDoPedidoNaMaquina, {
        payload: pedidoRecebido,
        status: "Recebido "
    });

    // Status 2: Em preparação (aciona cor AZUL no frontend)
    setTimeout(() => {
        const pedido = pedidosNaMaquina.get(idDoPedidoNaMaquina);
        // Só atualiza se o pedido ainda existir e não estiver já pronto/entregue
        if (pedido && !pedido.status.toLowerCase().includes("pronto") && !pedido.status.toLowerCase().includes("entregue")) {
            pedido.status = "Em preparação";
            console.log(`[STATUS UPDATE] Pedido ${idDoPedidoNaMaquina} -> Em preparação `);
        }
    }, 10000); // Muda após 10 segundos

    // Status 3: Pronto (aciona cor VERDE no frontend)
    setTimeout(() => {
        const pedido = pedidosNaMaquina.get(idDoPedidoNaMaquina);
        if (pedido) {
            pedido.status = "Pronto"; // <-- Palavra "Pronto" para acionar o verde
            console.log(`[STATUS UPDATE] Pedido ${idDoPedidoNaMaquina} -> Pronto `);
        }
    }, 20000); // Muda após 20 segundos no total

    console.log(`✅ Pedido recebido na máquina virtual às ${new Date().toLocaleTimeString()}`);
    console.log(`   ID Gerado: ${idDoPedidoNaMaquina}`);
    console.log('--------------------------------------------------');

    // Responde imediatamente com o ID e o status inicial
    res.status(200).json({
        id: idDoPedidoNaMaquina,
        status: 'Recebido ' // O status inicial que o frontend verá primeiro
    });
});

// ROTA PARA CHECAR O STATUS DE UM PEDIDO (GET)
app.get('/queue/items/:id', (req, res) => {
    const { id } = req.params;
    const pedido = pedidosNaMaquina.get(id);

    console.log(`[STATUS CHECK] Recebida consulta para ID: ${id}`);

    if (pedido) {
        console.log(`   Encontrado. Status: ${pedido.status}`);
        res.json({ id: id, status: pedido.status }); // Retorna o status atual
    } else {
        console.warn(`   Pedido ${id} não encontrado na memória.`);
        res.status(404).json({ status: 'Pedido não encontrado' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`🔥 Máquina Virtual (servidor simulado) rodando na porta ${PORT}`);
    console.log(`   Aguardando pedidos em http://localhost:${PORT}/queue/items`);
});

