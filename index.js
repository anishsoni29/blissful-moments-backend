const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors()); 
app.use(bodyParser.json()); 

// Import routes
const Userrouter = require('./routes/auth.js');
const Adminrouter = require('./routes/admin-auth.js');

// Use routes
app.use('/user', Userrouter);
app.use('/admin', Adminrouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});


const PORT = process.env.PORT || 3000; // Use environment variable if available
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
