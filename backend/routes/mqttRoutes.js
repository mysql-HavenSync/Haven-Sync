const express = require('express');
const mqttController = require('../controllers/mqttController');

const router = express.Router();

// Publish using MQTT SDK (recommended for real-time)
router.post('/publish/sdk', mqttController.publishViaSDK);

// Publish using EMQX HTTP API (good for external systems)
router.post('/publish/api', mqttController.publishViaAPI);

// Legacy route - defaults to SDK method
router.post('/publish', mqttController.publishViaSDK);

// Get MQTT connection status
router.get('/status', mqttController.getConnectionStatus);

// Subscribe to a topic
router.post('/subscribe', mqttController.subscribe);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'MQTT routes working',
    endpoints: {
      'POST /publish/sdk': 'Publish via MQTT SDK',
      'POST /publish/api': 'Publish via EMQX API',
      'POST /publish': 'Publish (default SDK)',
      'GET /status': 'Get connection status',
      'POST /subscribe': 'Subscribe to topic'
    }
  });
});

module.exports = router;