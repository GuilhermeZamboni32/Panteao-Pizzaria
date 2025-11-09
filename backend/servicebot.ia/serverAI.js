import express from 'express';
import dotenv from 'dotenv';
// --- CORREÇÃO 1: O NOME DO PACOTE CORRETO ---
import { GoogleGenerativeAI } from "@google/generative-ai"; 

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 5003;

// --- CORREÇÃO 2: O NOME DA CLASSE CORRETO ---
// (Agora bate com o 'import' da linha 4)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.use(express.json());

async function processMessage(message) {
  if (!message) {
    throw new Error("Mensagem vazia");
  }

  try {
    // A sintaxe moderna para gerar conteúdo
    const result = await model.generateContent(message); // 'message' é o prompt
    const response = await result.response;
    const text = await response.text();

    return text || "Sem resposta";

  } catch (error) {
    console.error("Erro ao chamar a API:", error.message);
    throw new Error("Erro ao se comunicar com a API");
  }
}

// Endpoint (Esta parte estava correta)
app.post('/api/ai', async (req, res) => {
  const { message } = req.body;

  // Adicionámos um log para sabermos que ele foi chamado
  console.log(`[Server 5003] Recebido prompt para IA: "${message.substring(0, 50)}..."`);

  try {
    const reply = await processMessage(message);
    console.log("[Server 5003] Resposta da IA gerada com sucesso.");
    res.json({ reply });
  } catch (error) {
    console.error("[Server 5003] Erro ao processar mensagem:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Inicia o microserviço
app.listen(PORT, () => {
  console.log(`🧠 AI (corrigido) rodando na porta ${PORT}`);
});