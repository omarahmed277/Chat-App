const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { setupSocket } = require('./controllers/socketController');
const { connectToDB } = require('./config/db');

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

(async () => {
  try {
    await connectToDB();
    console.log("✅ Database connected successfully");

    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Try a different port.`);
        process.exit(1);
      } else {
        console.error(`❌ Server error:`, err);
        process.exit(1);
      }
    });

    setupSocket(io);
  } catch (err) {
    console.error("❌ Failed to connect to the database:", err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});