const express = require('express');
const authRoutes = require('./backend/routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/usuarios', userRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});