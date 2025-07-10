// index.js
const http = require('http');
const app = require('./app'); // <-- your Express app
const { setupWebSocket } = require('./wsServer'); // <-- your custom WS server file

const server = http.createServer(app); // Use same server for both WS + HTTP
setupWebSocket(server); // Attach WebSocket to this server

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 HTTP & WebSocket server listening on port ${PORT}`);
});
