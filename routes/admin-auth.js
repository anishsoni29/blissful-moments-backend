require('dotenv').config();
const express = require('express');
const { Admin, User, Candles } = require('../db/index.js'); // Import models
const jwt = require('jsonwebtoken');
//const authenticateAdmin = require('../db/middleware/admin-auth.js'); // Import the middleware
const multer = require('multer');
const path = require('path');
const router = express.Router();
const fs = require('fs');
router.use(express.static(path.join(__dirname, '../../frontend/public')));



const secretKey = '1234589'; // Secret key for JWT
const uploadPath = process.env.IMAGE_UPLOAD_PATH;

// Ensure the directory exists (create if it doesn't)
fs.mkdir(uploadPath, { recursive: true }, (err) => {
  if (err) {
      return console.error('Error creating directory:', err);
  }

  console.log('Directory is ready:', uploadPath);
});
//////////////////////
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath); // Use the existing images folder
      console.log('Uploading file to path:', uploadPath); // Log path to debug
     
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`); // Rename the file to avoid name conflicts
    }
  });

  // Initialize multer with storage settings
  const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB limit
    fileFilter: function (req, file, cb) {
      const fileTypes = /jpeg|jpg|png/;
      const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = fileTypes.test(file.mimetype);
  
      if (extname && mimeType) {
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed'));
      }
    }
  });
//////////////////////

// Route to create a permanent admin (without token requirement)
router.post('/create-permanent-admin', async function(req, res) {
    const { username, password } = req.body;

    try {
        // Check if an admin already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create and save the new admin with plain text password
        const newAdmin = new Admin({ username, password });
        await newAdmin.save();

        // Generate a token for the new admin
        const token = jwt.sign({ username, role: 'admin' }, secretKey, { expiresIn: '1h' });

        res.json({ message: 'Permanent admin created successfully', token, isAdmin: true });
    } catch (error) {
        console.error('Error creating permanent admin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Middleware for authenticated routes (excluding admin creation)
//router.use(authenticateAdmin);

// Get users count route
router.get('/users-count',async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.json({ count: userCount });
    } catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Get additional statistics route
router.get('/statistics', async (req, res) => {
    try {
        console.log('Fetching statistics...');

        // Example query to fetch statistics data
        const statistics = await Candles.find({}); // Replace with actual model and query

        console.log('Statistics fetched:', statistics);

        res.json(statistics);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/recent-activity', async (req, res) => {
    try {
        console.log('Fetching recent activity...');

        const recentActivity = await User.find({}, { username: 1, lastLogin: 1 , email: 1})
            .sort({ lastLogin: -1 })
            .limit(10);

        console.log('Recent activity fetched:', recentActivity);

        const formattedActivity = recentActivity.map(activity => ({
            username: activity.username,
            lastLogin: activity.lastLogin.toString(),
            email: activity.email
        }));

        res.json(formattedActivity);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//To add Candles from Admin to Shop Section
router.post('/candles', upload.single('image'), async (req, res) => {
    const { name, price } = req.body;
  
    try {
      // Check if a candle with the same name and price already exists
      const existingCandle = await Candles.findOne({ name,price});
  
    if (existingCandle) {
        alert('Candle with the same name and price already exists!');
        
    }
  
      // If no existing candle is found, create a new candle instance
      const newCandle = new Candles({
        name,
        price,
        image: `/${req.file.filename}` // Save the relative path to the image
      });
  
      // Save the new candle to the database
      await newCandle.save();
  
      res.status(200).json({ message: 'Candle added successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to add candle', error });
    }
  });
  
  
  // Fetch all candles (for Testing)
router.get('/candles', async (req, res) => {
    try {
      const candles = await Candles.find();
      res.status(200).json(candles);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching candles', error });
    }
  });




module.exports = router;
