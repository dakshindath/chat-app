const express = require('express');
const { register, getUsers, login } = require('../controllers/authController.js'); 
const router = express.Router();

router.post('/register', register);
router.get('/users', getUsers);
router.post('/login', login);


module.exports = router;