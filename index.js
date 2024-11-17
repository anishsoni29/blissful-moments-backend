const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://blissful-moments.vercel.app/' // Update this to your production frontend URL
    : 'http://localhost:5173', // Development frontend URL (React)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Enable CORS with the configured options
app.use(cors(corsOptions));

// Middleware for parsing JSON
app.use(express.json()); // Built-in JSON parser middleware in Express

// Import routes
const Userrouter = require('./routes/auth.js');
const Adminrouter = require('./routes/admin-auth.js');

// Use routes
app.use('/user', Userrouter);
app.use('/admin', Adminrouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Server configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
