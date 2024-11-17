const express = require('express');
const { User, Candles, Admin } = require('../db/index.js');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const secretKey = process.env.JWT_SECRET || '1234589'; // Secret key for JWT

// Admin/User sign-in route
router.post('/signin', async (req, res) => {
    const { username, password, } = req.body;

    try {
        // First, check if the admin exists
        const admin = await Admin.findOne({ username, password });
        if (admin) {
            const token = jwt.sign({ username, role: 'admin' }, secretKey, { expiresIn: '1h' });
            return res.json({ message: 'Admin logged in', token, isAdmin: true });
        }

        // If not an admin, check for normal user
        let user = await User.findOne({ username });
        
        if (!user) {
            user = await User.create({ username, password, lastLogin: new Date() });
            return res.json({ message: 'User created successfully', isAdmin: false });
        }

        // If user exists, verify the password
        if (user.password === password) {
            user.lastLogin = new Date(); // Update lastLogin field
            await user.save(); // Save changes to the database
            const token = jwt.sign({ username, role: 'user' }, secretKey, { expiresIn: '1h' });
            return res.json({ message: 'User signed in successfully', token, isAdmin: false });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User Create 
router.post('/signup', async (req, res) => {
    const { username, password,email } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create a new user
      const newUser = new User({
        username,
        password,
        email
      });
  
      // Save the user to the database
      await newUser.save();
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });


// Google Sign-In route
router.post('/user/google-signin', async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // Check if the user already exists in the database
        const existingUser = await User.findOne({ googleId: payload.sub });
        
        if (existingUser) {
            // User already exists, generate JWT token
            const token = jwt.sign({ username: existingUser.username, role: 'user' }, secretKey, { expiresIn: '1h' });
            return res.json({ token });
        }

        // New user, create and save
        const newUser = await User.create({ 
            username: payload.name, 
            googleId: payload.sub, 
            lastLogin: new Date() 
        });
        const token = jwt.sign({ username: newUser.username, role: 'user' }, secretKey, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error during Google sign-in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get candles route
router.get('/candles', async (req, res) => {
    try {
        const response = await Candles.find({});
        res.json({ candles: response });
    } catch (error) {
        console.error('Error fetching candles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Purchase candle route
router.post('/candles/:candlesId', async (req, res) => {
    const candlesId = req.params.candlesId;
    const username = req.headers.username;

    try {
        await User.updateOne(
            { username: username },
            { "$push": { purchasedCandles: candlesId } }
        );
        res.json({ message: 'Purchase Completed' });
    } catch (error) {
        console.error('Error purchasing candle:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get purchased candles route
router.get('/purchasedcandles', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.headers.username });
        const candles = await Candles.find({ _id: { "$in": user.purchasedCandles } });
        res.json({ msg: candles });
    } catch (error) {
        console.error('Error fetching purchased candles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Check user existence
router.post('/check-user-exists', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });
        const admin = await Admin.findOne({ username });
        if (user || admin) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking user existence:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Password reset route
router.post('/forgot-password', async (req, res) => {
    const {  email , password} = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Set up email transporter
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            logger: true,
            debug: true,
            secure: true,
            port: 465,
            auth: {
                user: process.env.EMAIL, // Your Gmail address
                pass: process.env.EMAIL_PASSWORD, // Your Gmail password or app-specific password
            },
            tls: {
                rejectUnauthorized:true
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Password Recovery',
            text: `Dear ${user.username},\n\nYour password is: ${user.password}\n\nPlease keep your credentials secure.`,
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send email' });
            }
            console.log('Email sent:', info.response);
            res.json({ message: 'Password recovery email sent' });
        });
        console.log('Email:', process.env.EMAIL);
console.log('Password:', process.env.EMAIL_PASSWORD);


    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
