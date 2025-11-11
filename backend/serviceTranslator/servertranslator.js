import express from 'express';
import cors from 'cors';
import traduzirPizzaParaCaixinha from './traduzirPizzaParaCaixinha.js';

const app = express();
const PORT = process.env.PORT || 3004; // Porta para o tradutor

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.post('/api/traduzir', (req, res) => {
    try {
        const pizza = req.body;
        if (!pizza) {
            return res.status(400).json({ error: 'Pizza não fornecida' });
        }
        const payloadTraduzido = traduzirPizzaParaCaixinha(pizza);
        res.json(payloadTraduzido);
    } catch (error) {
        console.error('Erro na tradução:', error.message);
        res.status(500).json({ error: 'Erro interno na tradução' });
    }
});

app.listen(PORT, () => {
    console.log(`🧩 Serviço de Tradução rodando na porta ${PORT}`);
});
