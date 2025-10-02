
///maquinaVirtual.js////

import express from 'express';
import cors from 'cors';

// Configuração básica do nosso servidor simulador
const app = express();
const PORT = 3000; // A porta que a máquina precisa usar

// Middlewares para aceitar requisições e entender JSON
app.use(cors());
app.use(express.json());

console.log('🤖 Máquina Virtual Pronta para Receber Pedidos!');
console.log('--------------------------------------------------');

// A única rota que a máquina precisa ter.
// Ela vai escutar por requisições POST em '/queue/items'
app.post('/queue/items', (req, res) => {
  // Pega o pedido que o serverPizza.js enviou
  const pedidoRecebido = req.body;

  // Mostra no console o que recebemos, para sabermos que funcionou
  console.log(`✅ Pedido recebido na máquina virtual às ${new Date().toLocaleTimeString()}`);
  console.log('Payload:', JSON.stringify(pedidoRecebido, null, 2));
  console.log('--------------------------------------------------');

  app.get('/queue/items/:id', (req, res) => {
  const pedido = pedidoRecebido[req.params.id];
  if (pedido) {
    res.json({ status: pedido.status });
  } else {
    res.status(404).json({ status: 'Pedido não encontrado' });
  }
});

  // Envia uma resposta de sucesso, imitando a máquina real.
  // O frontend espera uma resposta com uma propriedade "id".
  res.status(200).json({
    id: `maquina-${Date.now()}`,
    status: 'Pedido recebido e em processamento na máquina virtual!'
  });
});

// Inicia o servidor e o deixa escutando na porta 3000
app.listen(PORT, () => {
  console.log(`🔥 Máquina Virtual (servidor simulado) rodando na porta ${PORT}`);
  console.log(`   Aguardando pedidos em http://localhost:${PORT}/queue/items`);
});
