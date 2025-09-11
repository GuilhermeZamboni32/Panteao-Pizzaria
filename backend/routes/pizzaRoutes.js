const express require('express');
const { getAllPizzas, getPizzaById, createPizza } = require('./services/pizzaServices');
const { getCurrentUser } = require('./services/authServices');
const { PizzaBaseSchema } = require('../schemas/pizzaSchemas');
const Joi = require('joi');

const router = express.Router();

// Middleware to check authentication
const authenticate = async (req, res, next) => {
  try {
    req.currentUser = await getCurrentUser(req);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// List all pizzas
router.get('/', authenticate, async (req, res) => {
  try {
    const pizzas = await getAllPizzas();
    res.json(pizzas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pizzas' });
  }
});

// Get a pizza by ID
router.get('/:pizzaId', authenticate, async (req, res) => {
  try {
    const pizza = await getPizzaById(req.params.pizzaId);
    if (!pizza) {
      return res.status(404).json({ error: 'Pizza not found' });
    }
    res.json(pizza);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pizza' });
  }
});

// Create a new pizza
router.post('/', authenticate, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = PizzaBaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pizza = await createPizza(value);
    res.status(201).json(pizza);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;