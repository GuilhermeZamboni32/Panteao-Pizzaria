
import express from 'express';
import { getUserDocByEmail, verifyPassword } from '../services/userServices.js';
import { createAccessToken } from '../services/authServices.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Fetch user by email
    const userDoc = await getUserDocByEmail(email);
    if (!userDoc || !verifyPassword(senha, userDoc.senha)) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Generate access token
    const token = createAccessToken(userDoc._id.toString(), userDoc.email);
    res.json({ access_token: token, token_type: 'bearer' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

module.exports = router;