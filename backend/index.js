const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./wsServer');

const server = http.createServer(app);
setupWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 HTTP & WebSocket server listening on port ${PORT}`);
});
