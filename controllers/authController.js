const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, avatar, password, confirmPassword } = req.body;
    if(password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
  try {
    let user = await User.findOne({ email });
    if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({ name, email, avatar, password: hashedPassword });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };


const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

module.exports = { register, getUsers, login };