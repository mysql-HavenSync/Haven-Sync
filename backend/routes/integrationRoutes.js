// routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Get user's integration settings
router.get('/', integrationController.getUserIntegrations);

// Toggle integration connection - FIX: Use URL params instead of body
router.post('/:service/connect', (req, res) => {
  req.body.service = req.params.service;
  req.body.action = 'connect';
  integrationController.toggleIntegration(req, res);
});

router.post('/:service/disconnect', (req, res) => {
  req.body.service = req.params.service;
  req.body.action = 'disconnect';
  integrationController.toggleIntegration(req, res);
});

// Sync devices with specific service
router.post('/:service/sync', integrationController.syncDevices);

// Service-specific webhook endpoints (for receiving data from external services)
router.post('/google/webhook', handleGoogleWebhook);
router.post('/alexa/webhook', handleAlexaWebhook);
router.post('/homekit/webhook', handleHomeKitWebhook);
router.post('/smartthings/webhook', handleSmartThingsWebhook);

// OAuth callback endpoints
router.get('/google/callback', handleGoogleCallback);
router.get('/alexa/callback', handleAlexaCallback);
router.get('/smartthings/callback', handleSmartThingsCallback);

// OAuth initiation endpoints
router.get('/:service/oauth', (req, res) => {
  const { service } = req.params;
  const { redirect_uri } = req.query;
  
  // Generate OAuth URLs
  const oauthUrls = {
    google: `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code&scope=https://www.googleapis.com/auth/assistant-sdk-prototype`,
    alexa: `https://www.amazon.com/ap/oa?client_id=${process.env.ALEXA_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code&scope=alexa:all`,
    smartthings: `https://account.smartthings.com/oauth/authorize?client_id=${process.env.SMARTTHINGS_CLIENT_ID}&redirect_uri=${redirect_uri}&response_type=code&scope=app`
  };
  
  if (oauthUrls[service]) {
    res.redirect(oauthUrls[service]);
  } else {
    res.status(400).json({ error: 'Invalid service' });
  }
});

// Webhook handlers
async function handleGoogleWebhook(req, res) {
  try {
    console.log('Google Assistant webhook received:', req.body);
    
    // Handle Google Assistant commands
    const { inputs, user } = req.body;
    
    if (inputs && inputs[0] && inputs[0].intent === 'action.devices.EXECUTE') {
      // Handle device control commands
      const commands = inputs[0].payload.commands;
      
      for (const command of commands) {
        for (const device of command.devices) {
          await executeDeviceCommand(device.id, command.execution[0]);
        }
      }
    }
    
    res.json({
      requestId: req.body.requestId,
      payload: {
        commands: [{
          ids: inputs[0].payload.commands[0].devices.map(d => d.id),
          status: 'SUCCESS'
        }]
      }
    });
  } catch (error) {
    console.error('Google webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleAlexaWebhook(req, res) {
  try {
    console.log('Alexa webhook received:', req.body);
    
    const { directive } = req.body;
    
    if (directive && directive.header.name === 'TurnOn') {
      const deviceId = directive.endpoint.endpointId;
      await executeDeviceCommand(deviceId, { command: 'TurnOn' });
    } else if (directive && directive.header.name === 'TurnOff') {
      const deviceId = directive.endpoint.endpointId;
      await executeDeviceCommand(deviceId, { command: 'TurnOff' });
    }
    
    res.json({
      event: {
        header: {
          messageId: directive.header.messageId,
          name: 'Response',
          namespace: 'Alexa',
          payloadVersion: '3'
        },
        payload: {}
      }
    });
  } catch (error) {
    console.error('Alexa webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleHomeKitWebhook(req, res) {
  try {
    console.log('HomeKit webhook received:', req.body);
    
    // Handle HomeKit accessory updates
    const { accessory, characteristic, value } = req.body;
    
    if (accessory && characteristic) {
      await executeDeviceCommand(accessory.id, {
        characteristic: characteristic,
        value: value
      });
    }
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('HomeKit webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSmartThingsWebhook(req, res) {
  try {
    console.log('SmartThings webhook received:', req.body);
    
    // Handle SmartThings device events
    const { deviceEvents } = req.body;
    
    if (deviceEvents) {
      for (const event of deviceEvents) {
        await executeDeviceCommand(event.deviceId, {
          capability: event.capability,
          attribute: event.attribute,
          value: event.value
        });
      }
    }
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('SmartThings webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// OAuth callback handlers
async function handleGoogleCallback(req, res) {
  try {
    const { code, state } = req.query;
    
    // Exchange code for tokens
    console.log('Google OAuth callback - Code:', code, 'State:', state);
    
    // In a real implementation, you would:
    // 1. Exchange the code for access/refresh tokens
    // 2. Store the tokens securely
    // 3. Complete the integration setup
    
    res.redirect('havensync://integration/success?service=google');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('havensync://integration/error?service=google');
  }
}

async function handleAlexaCallback(req, res) {
  try {
    const { code, state } = req.query;
    
    console.log('Alexa OAuth callback - Code:', code, 'State:', state);
    
    res.redirect('havensync://integration/success?service=alexa');
  } catch (error) {
    console.error('Alexa OAuth callback error:', error);
    res.redirect('havensync://integration/error?service=alexa');
  }
}

async function handleSmartThingsCallback(req, res) {
  try {
    const { code, state } = req.query;
    
    console.log('SmartThings OAuth callback - Code:', code, 'State:', state);
    
    res.redirect('havensync://integration/success?service=smartthings');
  } catch (error) {
    console.error('SmartThings OAuth callback error:', error);
    res.redirect('havensync://integration/error?service=smartthings');
  }
}

// Execute device command helper
async function executeDeviceCommand(deviceId, command) {
  const db = require('../db');
  const mqttClient = require('../services/mqttClient');
  
  try {
    // Get device info
    const [device] = await db.query('SELECT * FROM devices WHERE id = ?', [deviceId]);
    
    if (!device.length) {
      throw new Error('Device not found');
    }
    
    const deviceInfo = device[0];
    
    // Convert integration command to MQTT command
    let mqttCommand = {};
    
    switch (command.command || command.characteristic || command.capability) {
      case 'TurnOn':
      case 'On':
        mqttCommand = { action: 'turn_on' };
        break;
      case 'TurnOff':
      case 'Off':
        mqttCommand = { action: 'turn_off' };
        break;
      case 'SetBrightness':
        mqttCommand = { action: 'set_brightness', value: command.value };
        break;
      case 'SetTemperature':
        mqttCommand = { action: 'set_temperature', value: command.value };
        break;
      default:
        mqttCommand = { action: 'unknown', command: command };
    }
    
    // Send MQTT command
    const topic = `devices/${deviceInfo.device_id}/commands`;
    mqttClient.publish(topic, JSON.stringify(mqttCommand));
    
    // Log the command
    await db.query(
      'INSERT INTO integration_logs (user_id, service_name, action, status, message, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [
        deviceInfo.user_id,
        'device_command',
        'execute',
        'success',
        'Device command executed',
        JSON.stringify({ deviceId, command, mqttCommand })
      ]
    );
    
    console.log('Device command executed:', deviceId, command);
  } catch (error) {
    console.error('Error executing device command:', error);
    throw error;
  }
}

module.exports = router;