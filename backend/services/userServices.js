const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Assuming db is exported from a config file

const userCollection = db.collection('usuarios');

// Serialize user data for public response
const userPublicSerializer = (user) => ({
  id: user._id.toString(),
  nome: user.nome,
  email: user.email,
  endereco: user.endereco,
  numero_cartao: user.numero_cartao,
  validade_cartao: user.validade_cartao,
  cvv: user.cvv,
});

// Get user document by ID
const getUserDocById = async (userId) => {
  return await userCollection.findOne({ _id: new ObjectId(userId) });
};

// Get user document by email
const getUserDocByEmail = async (email) => {
  return await userCollection.findOne({ email });
};

// Get all users
const getAllUsers = async () => {
  const users = await userCollection.find().toArray();
  return users.map(userPublicSerializer);
};

// Get user by ID
const getUserById = async (userId) => {
  const user = await getUserDocById(userId);
  return user ? userPublicSerializer(user) : null;
};

// Create a new user
const createUser = async (user) => {
  const hashedPassword = await bcrypt.hash(user.senha, 10);
  const newUser = { ...user, senha: hashedPassword };
  const result = await userCollection.insertOne(newUser);
  return result.insertedId;
};

// Update user
const updateUser = async (userId, user) => {
  const updateData = Object.fromEntries(
    Object.entries(user).filter(([_, v]) => v != null)
  );

  if (updateData.senha) {
    updateData.senha = await bcrypt.hash(updateData.senha, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return null;
  }

  await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );

  return await getUserById(userId);
};

// Delete user
const deleteUser = async (userId) => {
  await userCollection.deleteOne({ _id: new ObjectId(userId) });
};

// Verify password
const verifyPassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserDocByEmail,
  createUser,
  updateUser,
  deleteUser,
  verifyPassword,
};