// index.js
const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./services/wsServer'); // ✅ fix path

const server = http.createServer(app);
setupWebSocket(server); // ✅ attach WS to HTTP server

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 HTTP & WebSocket server running on port ${PORT}`);
});
