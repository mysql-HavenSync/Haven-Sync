// services/mqttClient.js
const mqtt = require('mqtt');
require('dotenv').config();

const clientId = 'havensync_' + Math.random().toString(16).substring(2, 8);

// 🔍 Debug: Check if credentials are loaded
console.log('🔍 Debug Info:');
console.log('MQTT_USERNAME:', process.env.MQTT_USERNAME ? '✅ Set' : '❌ Missing');
console.log('MQTT_PASSWORD:', process.env.MQTT_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('MQTT_HOST:', process.env.MQTT_HOST);
console.log('MQTT_PORT:', process.env.MQTT_PORT);

// ✅ EMQX server configuration
const options = {
  clientId,
  host: process.env.MQTT_HOST || 't5542f49.ala.asia-southeast1.emqxsl.com',
  port: parseInt(process.env.MQTT_PORT) || 8883,
  protocol: 'mqtts',
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: false,  // 🔧 Temporarily disable for testing
  keepalive: 60,
  clean: true,
  reconnectPeriod: 5000,      // 🔧 Slower reconnect for debugging
  connectTimeout: 30 * 1000
};

console.log('🔄 Attempting to connect to EMQX server...');
const client = mqtt.connect(options);

client.on('connect', () => {
  console.log('✅ MQTT connected to EMQX server successfully!');
  console.log(`📱 Client ID: ${clientId}`);
  
  // Subscribe to test topics
  client.subscribe('havensync/+/status', (err) => {
    if (!err) {
      console.log('📡 Subscribed to device status topics');
    }
  });
});

client.on('error', (err) => {
  console.error('❌ MQTT connection error:', err.message);
});

client.on('offline', () => {
  console.log('📴 MQTT client offline');
});

client.on('reconnect', () => {
  console.log('🔄 MQTT reconnecting...');
});

client.on('message', (topic, message) => {
  console.log(`📩 Received: ${topic} → ${message.toString()}`);
  
  try {
    const data = JSON.parse(message.toString());
    console.log('📊 Parsed data:', data);
  } catch (err) {
    console.log('📝 Non-JSON message received:', message.toString());
  }
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down MQTT client...');
  client.end();
  process.exit();
});

module.exports = client;