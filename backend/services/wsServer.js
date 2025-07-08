const WebSocket = require('ws');

const deviceConnections = new Map(); // deviceId => socket

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('🔌 WebSocket client connected');

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);

        if (data.type === 'device_register') {
          const { deviceId } = data;
          deviceConnections.set(deviceId, ws);
          console.log(`✅ Device registered: ${deviceId}`);

        } else if (data.type === 'device_status') {
          console.log(`📡 Status from ${data.deviceId}`, data);

        } else if (data.type === 'switch_physical') {
          console.log(`🟢 Physical switch change: ${data.deviceId}`, data);

        } else if (data.type === 'pir_motion') {
          console.log(`🚨 Motion detected by ${data.deviceId}`, data.motionDetected);

        } else {
          console.log('⚠️ Unhandled message:', data);
        }

      } catch (err) {
        console.error('❌ Invalid JSON from device:', err.message);
      }
    });

    ws.on('close', () => {
      console.log('❌ WebSocket client disconnected');
      for (const [deviceId, socket] of deviceConnections.entries()) {
        if (socket === ws) {
          deviceConnections.delete(deviceId);
          break;
        }
      }
    });
  });

  console.log('✅ WebSocket server ready at /ws');
}

module.exports = { setupWebSocket, deviceConnections };
