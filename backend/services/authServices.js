
import jwt from 'jsonwebtoken';
import getUserDocById from './userServices.js';
import { JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES } from '../config/auth.js';

// Create an access token
const createAccessToken = (sub, email) => {
  const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const expire = now + ACCESS_TOKEN_EXPIRE_MINUTES * 60; // Expiration time in seconds

  const payload = {
    sub,
    email,
    iat: now,
    exp: expire,
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: JWT_ALGORITHM });
};

// Decode a token
const decodeToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    return {
      sub: payload.sub,
      email: payload.email,
      exp: payload.exp,
    };
  } catch (err) {
    const error = new Error('Token inválido');
    error.status = 401;
    throw error;
  }
};

// Middleware to get the current user from the token
const getCurrentUser = async (token) => {
  const data = decodeToken(token);
  const userDoc = await getUserDocById(data.sub);

  if (!userDoc) {
    const error = new Error('Usuário não encontrado');
    error.status = 401;
    throw error;
  }

  return {
    id: userDoc._id.toString(),
    email: userDoc.email,
    nome: userDoc.nome,
  };
};

module.exports = {
  createAccessToken,
  decodeToken,
  getCurrentUser,
};