const express = require('express');
const { getMessages } = require('../controllers/messageController.js');
const router = express.Router();

router.get('/', getMessages);

module.exports = router;