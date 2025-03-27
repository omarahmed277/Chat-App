const { User } = require('../models/User');
const Message = require('../models/Message');
const { broadcastUserList } = require('../utils/socketUtils');

const users = {};

exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on('register', async ({ email, name }) => {
      if (!email || !name) {
        socket.emit('error', 'Email and name are required');
        return;
      }
      users[email] = socket.id;
      try {
        await User.findOneAndUpdate(
          { email },
          { $setOnInsert: { name, phone: '', password: '', profileCompleted: false, connections: [], pendingRequests: [] } },
          { upsert: true, new: true }
        );
        broadcastUserList(io, users, email);
      } catch (err) {
        socket.emit('error', 'Failed to register user');
      }
    });

    socket.on('sendConnectionRequest', async ({ from, to }) => {
      try {
        const receiver = await User.findOneAndUpdate({ email: to }, { $addToSet: { pendingRequests: from } });
        if (!receiver) return socket.emit('error', 'Receiver not found');
        if (users[to]) io.to(users[to]).emit('connectionRequest', { from });
        broadcastUserList(io, users, to);
        broadcastUserList(io, users, from);
      } catch (err) {
        socket.emit('error', 'Failed to send connection request');
      }
    });

    socket.on('acceptConnection', async ({ from, to }) => {
      try {
        await User.findOneAndUpdate({ email: from }, { $addToSet: { connections: to } });
        await User.findOneAndUpdate({ email: to }, { $addToSet: { connections: from }, $pull: { pendingRequests: from } });
        broadcastUserList(io, users, from);
        broadcastUserList(io, users, to);
      } catch (err) {
        socket.emit('error', 'Failed to accept connection');
      }
    });

    socket.on('declineConnection', async ({ from, to }) => {
      try {
        await User.findOneAndUpdate({ email: to }, { $pull: { pendingRequests: from } });
        if (users[from]) io.to(users[from]).emit('connectionDeclined', { from, to });
        broadcastUserList(io, users, to);
      } catch (err) {
        socket.emit('error', 'Failed to decline connection');
      }
    });

    socket.on('removeFriend', async ({ from, to }) => {
      try {
        await User.findOneAndUpdate({ email: from }, { $pull: { connections: to } });
        await User.findOneAndUpdate({ email: to }, { $pull: { connections: from } });
        if (users[to]) io.to(users[to]).emit('friendRemoved', { from, to });
        if (users[from]) io.to(users[from]).emit('friendRemoved', { from, to });
        broadcastUserList(io, users, from);
        broadcastUserList(io, users, to);
      } catch (err) {
        socket.emit('error', 'Failed to remove friend');
      }
    });

    socket.on('loadMessages', async ({ sender, receiver }) => {
      try {
        const messages = await Message.find({ $or: [{ sender, receiver }, { sender: receiver, receiver: sender }] })
          .populate('replyTo', 'message')
          .sort({ timestamp: 1 });
        const senderUser = await User.findOne({ email: sender });
        const receiverUser = await User.findOne({ email: receiver });
        const formattedMessages = messages.map(msg => ({
          _id: msg._id,
          sender: msg.sender,
          senderName: senderUser.name,
          receiver: msg.receiver,
          receiverName: receiverUser.name,
          message: msg.message,
          timestamp: msg.timestamp,
          status: msg.status,
          replyTo: msg.replyTo?._id || null,
          replyMessage: msg.replyTo?.message || null,
        }));
        socket.emit('previousMessages', formattedMessages);
      } catch (err) {
        socket.emit('error', 'Failed to load messages');
      }
    });

    socket.on('sendMessage', async (data) => {
      const { sender, receiver, message, replyTo } = data;
      try {
        const senderUser = await User.findOne({ email: sender });
        if (!senderUser || !senderUser.connections.includes(receiver)) {
          socket.emit('error', 'You must be connected to send messages.');
          return;
        }
        const receiverUser = await User.findOne({ email: receiver });
        const newMessage = new Message({ sender, receiver, message, replyTo });
        await newMessage.save();
        const formattedMessage = {
          _id: newMessage._id,
          sender,
          senderName: senderUser.name,
          receiver,
          receiverName: receiverUser.name,
          message,
          timestamp: newMessage.timestamp,
          status: newMessage.status,
          replyTo: newMessage.replyTo || null,
          replyMessage: replyTo ? (await Message.findById(replyTo))?.message : null,
        };
        if (users[receiver]) io.to(users[receiver]).emit('receiveMessage', formattedMessage);
        socket.emit('receiveMessage', formattedMessage);
      } catch (err) {
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('deleteMessage', async ({ messageId, sender, receiver }) => {
      try {
        await Message.findByIdAndDelete(messageId);
        if (users[receiver]) io.to(users[receiver]).emit('messageDeleted', { messageId });
        if (users[sender]) io.to(users[sender]).emit('messageDeleted', { messageId });
      } catch (err) {
        socket.emit('error', 'Failed to delete message');
      }
    });

    socket.on('getUserName', async ({ email }, callback) => {
      try {
        const user = await User.findOne({ email }).select('name');
        callback(user ? { name: user.name, email } : { name: 'Unknown', email });
      } catch (err) {
        callback({ name: 'Error', email });
      }
    });

    socket.on('searchUsers', async ({ query, email }) => {
      try {
        const currentUser = await User.findOne({ email });
        if (!currentUser) return socket.emit('error', 'User not found');
        const allUsers = await User.find({ name: { $regex: new RegExp(query, 'i') }, email: { $ne: email } })
          .select('name email connections pendingRequests');
        const connectedUsers = currentUser.connections || [];
        const searchResults = allUsers.map(user => ({
          name: user.name,
          email: user.email,
          connected: connectedUsers.includes(user.email),
          pending: user.pendingRequests.includes(email),
        }));
        socket.emit('searchResults', searchResults);
      } catch (err) {
        socket.emit('error', 'Failed to search users');
      }
    });

    socket.on('typing', ({ sender, receiver }) => {
      if (users[receiver]) io.to(users[receiver]).emit('typing', { sender });
    });

    socket.on('stopTyping', ({ sender, receiver }) => {
      if (users[receiver]) io.to(users[receiver]).emit('stopTyping', { sender });
    });

    socket.on('disconnect', () => {
      const disconnectedUser = Object.keys(users).find(email => users[email] === socket.id);
      if (disconnectedUser) {
        delete users[disconnectedUser];
        broadcastUserList(io, users, disconnectedUser);
      }
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};