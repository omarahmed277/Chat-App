const { User } = require('../models/User');

exports.broadcastUserList = async (io, users, email) => {
  if (!email || !users[email]) return;
  try {
    const user = await User.findOne({ email });
    if (!user) return;
    const onlineUsers = Object.keys(users);
    const userStatus = await Promise.all(
      (user.connections || []).map(async (conn) => {
        const connectedUser = await User.findOne({ email: conn }).select('name email');
        return { name: connectedUser.name, email: connectedUser.email, online: onlineUsers.includes(conn) };
      })
    );
    io.to(users[email]).emit('updateUsers', {
      connections: userStatus,
      pendingRequests: user.pendingRequests || [],
    });
  } catch (err) {
    console.error('❌ Error broadcasting user list:', err);
  }
};