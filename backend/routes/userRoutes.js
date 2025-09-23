const express = require('express');
const { getAllUsers, getUserById, createUser } = require('../services/userServices');
const { getCurrentUser } = require('../services/authServices');

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

// List all users
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get current user's profile
router.get('/me', authenticate, (req, res) => {
  res.json(req.currentUser);
});

// Get a user by ID
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;