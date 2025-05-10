const Message = require('./models/Message.js');
const User = require('./models/User.js');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    socket.on('join', async (userId) => {
      socket.userId = userId;
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('users-updated');
    });

    socket.on('send-message', async ({ sender, receiver, text }) => {
      const message = await Message.create({ sender, receiver, text });
      io.to(receiver).emit('receive-message', message);
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
        io.emit('users-updated');
      }
      console.log('User disconnected', socket.id);
    });
  });
};

module.exports = { setupSocket };