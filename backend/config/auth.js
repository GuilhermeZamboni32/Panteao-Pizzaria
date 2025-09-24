
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod'; // Define in .env
const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '60', 10);

function getAccessTokenExpires() {
  return ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000; // Convert minutes to milliseconds
}

module.exports = {
  JWT_SECRET,
  JWT_ALGORITHM,
  getAccessTokenExpires,
};