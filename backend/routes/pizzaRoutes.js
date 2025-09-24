
import express from 'express'
import { getAllPizzas, getPizzaById, createPizza } from './services/pizzaServices';;
import getCurrentUser from './services/authServices';
import { PizzaBaseSchema } from '../schemas/pizzaSchemas';
import Joi from 'joi';


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

router.post('/', async (req, res) => {
    const { pizzas } = req.body;
    try {
        for (const pizza of pizzas) {
            await pool.query(
                'INSERT INTO pizzas (nome, ingredientes, preco) VALUES ($1, $2, $3)',
                [pizza.tamanho, JSON.stringify(pizza.ingredientes), 0] // ajuste o preço conforme necessário
            );
        }
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar pizza' });
    }
});

module.exports = router;