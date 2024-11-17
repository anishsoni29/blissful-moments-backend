// db/index.js
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://kush090605:y5nsS29QUQ0FNpi8@cluster0.wohixap.mongodb.net/Candles?authMechanism=DEFAULT");

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const UserSchema = new mongoose.Schema({
    username: String,
    googleId: String, 
    password: String,
    purchasedCandles: [{
        type: mongoose.Types.ObjectId,
        ref: 'Candles'
    }],
    lastLogin: { type: Date },
    email: { type: String, required: true, unique: true }
});
const candleSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    purchasedCandles: [{
      type: mongoose.Types.ObjectId,
      ref: 'Candles'
    }],
  });
const Admin = mongoose.model('Admin', AdminSchema);
const User = mongoose.model('User', UserSchema);
const Candles = mongoose.model('Candles', candleSchema);

module.exports = {
    Admin,
    User,
    Candles
};
