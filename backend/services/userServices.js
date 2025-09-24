
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Function to register a new user
 export const createUser = async (nome, email, senha, telefone, numero_cartao, validade_cartao, cvv) => {
  const client = await pool.connect();
  try {
    // Check if user already exists
    const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash important information
    const hashedPassword = await bcrypt.hash(senha, 10);
    const hashedNumeroCartao = await bcrypt.hash(numero_cartao, 10);
    const hashedCvv = await bcrypt.hash(cvv, 10);

    // Insert new user into the database
    const result = await client.query(
      'INSERT INTO users (nome, email, senha, telefone, numero_cartao, validade_cartao, cvv) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email',
      [nome, email, hashedPassword, telefone, hashedNumeroCartao, validade_cartao, hashedCvv]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to authenticate a user and generate a JWT token
 const authenticateUser = async (email, senha) => {
  const client = await pool.connect();
  try {
    // Find user by email
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { token, user: { id: user.id, nome: user.nome, email: user.email } };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to get user details by ID
export const getUserById = async (id) => {

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, nome, email, telefone FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to update user details
 const updateUser = async (id, nome, email, telefone) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE users SET nome = $1, email = $2, telefone = $3 WHERE id = $4 RETURNING id, nome, email, telefone',
      [nome, email, telefone, id]
    );
    if (result.rows.length === 0) {
      throw new Error('User not found or no changes made');
    }
    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to delete a user
 const deleteUser = async (id) => {
  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    return { message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to change user password
 const changeUserPassword = async (id, oldSenha, newSenha) => {
  const client = await pool.connect();
  try {
    // Find user by ID
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Compare the provided old password with the stored hashed password
    const isMatch = await bcrypt.compare(oldSenha, user.senha);
    if (!isMatch) {
      throw new Error('Old password is incorrect');
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newSenha, 10);

    // Update the user's password in the database
    await client.query('UPDATE users SET senha = $1 WHERE id = $2', [hashedNewPassword, id]);

    return { message: 'Password changed successfully' };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

export const getAllUsers = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, nome, email, telefone FROM users');
    return result.rows;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

//export { authenticateUser, updateUser, deleteUser, changeUserPassword };