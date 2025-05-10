const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  timestamp: { type: Date, default: Date.now },
  // File attachment fields
  hasAttachment: { type: Boolean, default: false },
  attachmentType: { type: String, enum: ['image', 'video', 'file'], default: null },
  attachmentUrl: String,
  attachmentName: String,
  attachmentSize: Number
});

module.exports = mongoose.model('Message', messageSchema);