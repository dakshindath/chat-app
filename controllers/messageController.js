const Message = require('../models/Message.js');

const getMessages = async (req, res) => {
  const { senderId, receiverId } = req.query;
  const messages = await Message.find({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ]
  }).sort({ timestamp: 1 });
  res.json(messages);
};

module.exports = { getMessages };