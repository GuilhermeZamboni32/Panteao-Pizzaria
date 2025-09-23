import pool from '../config/db';
import format from 'pg-format';

// Function to get all pizzas
exports.getAllPizzas = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM pizzas');
    return result.rows;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to order a pizza
exports.orderPizza = async (userId, pizzaId, quantity) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO orders (user_id, pizza_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [userId, pizzaId, quantity]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to get orders by user ID
exports.getOrdersByUserId = async (userId) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT o.id, o.quantity, o.order_date, p.name AS pizza_name, p.description, p.price
       FROM orders o
       JOIN pizzas p ON o.pizza_id = p.id
       WHERE o.user_id = $1`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

// Function to make your own pizza
exports.createCustomPizza = async (name, description, price) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO pizzas (name, description, price) VALUES ($1, $2, $3) RETURNING *',
      [name, description, price]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};