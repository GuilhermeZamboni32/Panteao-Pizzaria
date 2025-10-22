import express from 'express';
import cors from 'cors';

// Configuração básica do nosso servidor simulador
const app = express();
const PORT = 3000; // A porta que a máquina precisa usar

// --- ARMAZENAMENTO EM MEMÓRIA ---
// Vamos usar um Map para guardar os pedidos que chegam.
const pedidosNaMaquina = new Map();

// Middlewares para aceitar requisições e entender JSON
app.use(cors());
app.use(express.json());

console.log('🤖 Máquina Virtual Pronta para Receber Pedidos!');
console.log('--------------------------------------------------');

// ROTA PARA RECEBER NOVOS PEDIDOS (POST)
app.post('/queue/items', (req, res) => {
    const pedidoRecebido = req.body;

    // Gera um ID único para este pedido na máquina virtual
    const idDoPedidoNaMaquina = `maquina-${Date.now()}`;

    // Armazena o pedido no nosso "banco de dados" em memória
    pedidosNaMaquina.set(idDoPedidoNaMaquina, {
        payload: pedidoRecebido,
        status: "Recebido na VM"
    });

    // Simula uma mudança de status após 5 segundos
    setTimeout(() => {
        const pedido = pedidosNaMaquina.get(idDoPedidoNaMaquina);
        if (pedido) {
            pedido.status = "Em preparação (VM)";
            console.log(`[STATUS UPDATE] Pedido ${idDoPedidoNaMaquina} mudou para "Em preparação (VM)"`);
        }
    }, 5000);

    // Mostra no console o que recebemos
    console.log(`✅ Pedido recebido na máquina virtual às ${new Date().toLocaleTimeString()}`);
    console.log(`   ID Gerado: ${idDoPedidoNaMaquina}`);
    console.log('   Payload:', JSON.stringify(pedidoRecebido, null, 2));
    console.log('--------------------------------------------------');

    // Envia uma resposta de sucesso com o ID gerado
    res.status(200).json({
        id: idDoPedidoNaMaquina,
        status: 'Recebido na VM'
    });
});

// ROTA PARA CHECAR O STATUS DE UM PEDIDO (GET)
// (Movido para fora do POST para funcionar corretamente)
app.get('/queue/items/:id', (req, res) => {
    const { id } = req.params;
    const pedido = pedidosNaMaquina.get(id);

    console.log(`[STATUS CHECK] Recebida consulta para ID: ${id}`);

    if (pedido) {
        console.log(`   Encontrado. Status: ${pedido.status}`);
        res.json({ id: id, status: pedido.status });
    } else {
        console.warn(`   Pedido ${id} não encontrado na memória da VM.`);
        res.status(404).json({ status: 'Pedido não encontrado na VM' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`🔥 Máquina Virtual (servidor simulado) rodando na porta ${PORT}`);
    console.log(`   Aguardando pedidos em http://localhost:${PORT}/queue/items`);
});
