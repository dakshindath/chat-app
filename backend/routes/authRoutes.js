const express = require('express');
const { register, getUsers, login, logout } = require('../controllers/authController.js'); 
const router = express.Router();

router.post('/register', register);
router.get('/users', getUsers);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;