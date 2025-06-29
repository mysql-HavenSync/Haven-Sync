const axios = require('axios');
const mqttClient = require('../services/mqttClient');

const EMQX_API_BASE = process.env.EMQX_API_BASE || 'https://t5542f49.ala.asia-southeast1.emqxsl.com:8443/api/v5';
const EMQX_API_TOKEN = process.env.EMQX_API_TOKEN;

// Publish using MQTT SDK
exports.publishViaSDK = async (req, res) => {
  const { topic, payload } = req.body;

  try {
    if (!topic || payload === undefined) {
      return res.status(400).json({ error: 'Topic and payload are required' });
    }

    const messagePayload = typeof payload === 'object' ? JSON.stringify(payload) : payload.toString();
    
    mqttClient.publish(topic, messagePayload, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ MQTT SDK publish error:', err);
        return res.status(500).json({ error: 'MQTT publish failed', details: err.message });
      }
      
      console.log(`✅ Published via SDK: ${topic} → ${messagePayload}`);
      res.status(200).json({ 
        message: 'Message published via MQTT SDK', 
        topic,
        payload: messagePayload,
        method: 'SDK'
      });
    });

  } catch (err) {
    console.error('Error in SDK publish:', err.message);
    res.status(500).json({ error: 'SDK publish failed', details: err.message });
  }
};

// Publish using EMQX HTTP API
exports.publishViaAPI = async (req, res) => {
  const { topic, payload } = req.body;

  try {
    if (!topic || payload === undefined) {
      return res.status(400).json({ error: 'Topic and payload are required' });
    }

    if (!EMQX_API_TOKEN) {
      return res.status(500).json({ error: 'EMQX API token not configured' });
    }

    const response = await axios.post(
      `${EMQX_API_BASE}/mqtt/publish`,
      {
        topic,
        payload: typeof payload === 'object' ? JSON.stringify(payload) : payload.toString(),
        qos: 1,
        retain: false
      },
      {
        headers: {
          Authorization: `Bearer ${EMQX_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log(`✅ Published via API: ${topic}`);
    res.status(200).json({ 
      message: 'Message published via EMQX API', 
      topic,
      payload,
      method: 'API',
      data: response.data 
    });

  } catch (err) {
    console.error('❌ EMQX API publish error:', err.message);
    res.status(500).json({ 
      error: 'EMQX API publish failed', 
      details: err.response?.data || err.message 
    });
  }
};

// Get connection status
exports.getConnectionStatus = (req, res) => {
  const isConnected = mqttClient.connected;
  
  res.json({
    connected: isConnected,
    clientId: mqttClient.options?.clientId || 'unknown',
    server: `${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
    status: isConnected ? 'Connected to EMQX server' : 'Disconnected'
  });
};

// Subscribe to topic
exports.subscribe = (req, res) => {
  const { topic } = req.body;
  
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.error('❌ Subscribe error:', err);
      return res.status(500).json({ error: 'Subscribe failed', details: err.message });
    }
    
    console.log(`📡 Subscribed to: ${topic}`);
    res.json({ message: `Subscribed to ${topic}` });
  });
};