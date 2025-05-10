const Message = require('./models/Message.js');
const User = require('./models/User.js');

const setupSocket = (io) => {
  // Keep track of connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    // Emit all users (with online status) immediately on connection
    User.find().then(users => {
      socket.emit('users-updated', users);
    }).catch(err => {
      console.error('Error fetching users:', err);
    });

    socket.on('message', async (payload) => {
      try {
        const { event, data } = typeof payload === 'string' ? JSON.parse(payload) : payload;

        console.log(`Event received: ${event}`, data);

        if (event === 'join') {
          console.log(`User joined: ${data}`);
          
          // Store the userId in the socket object and the connectedUsers map
          socket.userId = data;
          connectedUsers.set(data, socket.id);
          
          // Join a room with the user's ID
          socket.join(data);
          
          // Update user's online status in the database
          await User.findByIdAndUpdate(data, { isOnline: true });
          
          // Get all users and emit to all clients
          const allUsers = await User.find();
          io.emit('users-updated', allUsers);
        }        if (event === 'send-message') {
          const { sender, receiver, text, hasAttachment, attachmentType, attachmentUrl, attachmentName, attachmentSize } = data;
          console.log(`Message from ${sender} to ${receiver}: ${text}`); 
          
          const messageData = { 
            sender, 
            receiver, 
            text,
            hasAttachment: hasAttachment || false
          };
          
          // Add attachment data if present
          if (hasAttachment) {
            messageData.attachmentType = attachmentType;
            messageData.attachmentUrl = attachmentUrl;
            messageData.attachmentName = attachmentName;
            messageData.attachmentSize = attachmentSize;
          }
          
          const message = await Message.create(messageData);
          
          // Emit to specific room (receiver's user ID)
          console.log('Emitting to receiver:', receiver);
          
          // Emit to both the sender and receiver
          io.to(receiver).emit('receive-message', message);
          io.to(sender).emit('receive-message', message);
        }
      } catch (err) {
        console.error(`Error handling message event: ${err.message}`);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`); 
      try {
        if (socket.userId) {
          // Update user's online status in the database
          await User.findByIdAndUpdate(socket.userId, { isOnline: false });
          
          // Remove from connected users map
          connectedUsers.delete(socket.userId);
          
          // Get all users and emit to all clients
          const allUsers = await User.find();
          io.emit('users-updated', allUsers);
        }
      } catch (err) {
        console.error(`Error in disconnect event: ${err.message}`);
      }
    });
  });
};

module.exports = { setupSocket };