const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  avatar: String,
  password:{ type: String, required: true },
  isOnline: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);