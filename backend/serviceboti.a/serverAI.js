import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 5003;

// Inicializar o cliente do Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, 
});

app.use(express.json());

async function processMessage(message) {
  if (!message) {
    throw new Error("Mensagem vazia");
  }

  try {
    // Chamar o modelo para gerar conteúdo
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
    });

    return response.text || "Sem resposta";
  } catch (error) {
    console.error("Erro ao chamar a API:", error.message);
    throw new Error("Erro ao se comunicar com a API");
  }
}

// Endpoint para o chatbot
app.post('/api/ai', async (req, res) => {
  const { message } = req.body;

  try {
    const reply = await processMessage(message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicia o microserviço
app.listen(PORT, () => {
  console.log(`AI rodando na porta ${PORT}`);
});