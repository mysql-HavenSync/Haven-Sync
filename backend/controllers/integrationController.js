// controllers/integrationController.js
const db = require('../db');
const axios = require('axios');

// Get user's integration settings
exports.getUserIntegrations = async (req, res) => {
  try {
    console.log('📥 [Integration] GET /api/integrations hit');
    console.log('👤 Authenticated user from req.user:', req.user);

    const userId = req.user.id;
    
    const [integrations] = await db.query(
      'SELECT * FROM users_integrations WHERE user_id = ?',
      [userId]
    );
    console.log('📄 Raw DB integrations:', integrations);
    // Default integrations if none exist
    const defaultIntegrations = {
      google: { connected: false, name: 'Google Assistant', config: {} },
      alexa: { connected: false, name: 'Amazon Alexa', config: {} },
      homekit: { connected: false, name: 'Apple HomeKit', config: {} },
      smartthings: { connected: false, name: 'Samsung SmartThings', config: {} }
    };
    
    // Convert array to object format
    const userIntegrations = { ...defaultIntegrations };
    if (integrations && Array.isArray(integrations)) {
  integrations.forEach(integration => {
    userIntegrations[integration.service_name] = {
      connected: integration.is_connected,
      name: integration.display_name,
      config: JSON.parse(integration.config || '{}'),
      connectedAt: integration.connected_at,
      lastSync: integration.last_sync
    };
  });
}

    res.json({
      success: true,
      integrations: userIntegrations
    });
  } catch (error) {
    console.error('❌ Error in getUserIntegrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch integrations',
      error: error.message
    });
  }
};


exports.toggleIntegration = async (req, res) => {
  const { service, action } = req.body;
  const userId = req.user.id;

  if (!service || !['connect', 'disconnect'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid service or action' });
  }

  const connected = action === 'connect';

  try {
    // Insert or update integration status
    await db.query(
      'INSERT INTO users_integrations (user_id, service, connected) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE connected = ?',
      [userId, service, connected, connected]
    );

    res.json({
      success: true,
      message: `Integration ${connected ? 'connected' : 'disconnected'} successfully`,
      service,
      connected
    });
  } catch (error) {
    console.error('🔴 DB error in toggleIntegration:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// Service-specific connection handlers
async function connectToService(service, userId, data) {
  switch (service) {
    case 'google':
      return await connectGoogleAssistant(userId, data);
    case 'alexa':
      return await connectAlexa(userId, data);
    case 'homekit':
      return await connectHomeKit(userId, data);
    case 'smartthings':
      return await connectSmartThings(userId, data);
    default:
      return { success: false, message: 'Unknown service' };
  }
}

async function disconnectFromService(service, userId) {
  switch (service) {
    case 'google':
      return await disconnectGoogleAssistant(userId);
    case 'alexa':
      return await disconnectAlexa(userId);
    case 'homekit':
      return await disconnectHomeKit(userId);
    case 'smartthings':
      return await disconnectSmartThings(userId);
    default:
      return { success: false, message: 'Unknown service' };
  }
}

// Google Assistant Integration
async function connectGoogleAssistant(userId, data) {
  try {
    // In a real implementation, you would:
    // 1. Validate OAuth tokens
    // 2. Register with Google Assistant API
    // 3. Set up device fulfillment
    
    const config = {
      clientId: data.clientId || 'demo-client-id',
      projectId: data.projectId || 'havensync-project',
      webhookUrl: `${process.env.BASE_URL}/api/integrations/google/webhook`,
      features: ['Voice Control', 'Routine Automation', 'Smart Displays']
    };
    
    // Simulate API call
    console.log('Connecting to Google Assistant for user:', userId);
    
    return {
      success: true,
      displayName: 'Google Assistant',
      config: config
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Google Assistant: ' + error.message
    };
  }
}

// Amazon Alexa Integration
async function connectAlexa(userId, data) {
  try {
    const config = {
      skillId: data.skillId || 'amzn1.ask.skill.havensync',
      clientId: data.clientId || 'alexa-client-id',
      redirectUri: `${process.env.BASE_URL}/api/integrations/alexa/callback`,
      features: ['Echo Integration', 'Skills', 'Drop In']
    };
    
    console.log('Connecting to Amazon Alexa for user:', userId);
    
    return {
      success: true,
      displayName: 'Amazon Alexa',
      config: config
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Amazon Alexa: ' + error.message
    };
  }
}

// Apple HomeKit Integration
async function connectHomeKit(userId, data) {
  try {
    const config = {
      accessoryId: data.accessoryId || 'HavenSync-Bridge',
      setupCode: data.setupCode || '123-45-678',
      category: 'Bridge',
      features: ['Siri Control', 'Home App', 'Secure Video']
    };
    
    console.log('Connecting to Apple HomeKit for user:', userId);
    
    return {
      success: true,
      displayName: 'Apple HomeKit',
      config: config
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Apple HomeKit: ' + error.message
    };
  }
}

// Samsung SmartThings Integration
async function connectSmartThings(userId, data) {
  try {
    const config = {
      appId: data.appId || 'havensync-smartthings',
      apiToken: data.apiToken || 'st-demo-token',
      locationId: data.locationId || 'location-id',
      features: ['Device Automation', 'Scenes', 'Energy Monitoring']
    };
    
    console.log('Connecting to Samsung SmartThings for user:', userId);
    
    return {
      success: true,
      displayName: 'Samsung SmartThings',
      config: config
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Samsung SmartThings: ' + error.message
    };
  }
}

// Disconnection handlers
async function disconnectGoogleAssistant(userId) {
  try {
    console.log('Disconnecting Google Assistant for user:', userId);
    // Revoke tokens, unregister webhooks, etc.
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to disconnect Google Assistant' };
  }
}

async function disconnectAlexa(userId) {
  try {
    console.log('Disconnecting Amazon Alexa for user:', userId);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to disconnect Amazon Alexa' };
  }
}

async function disconnectHomeKit(userId) {
  try {
    console.log('Disconnecting Apple HomeKit for user:', userId);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to disconnect Apple HomeKit' };
  }
}

async function disconnectSmartThings(userId) {
  try {
    console.log('Disconnecting Samsung SmartThings for user:', userId);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to disconnect Samsung SmartThings' };
  }
}

// Sync devices with integrated platforms
exports.syncDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { service } = req.params;
    
    // Get user's devices
    const [devices] = await db.query(
      'SELECT * FROM devices WHERE user_id = ? AND status = "active"',
      [userId]
    );
    
    // Get integration config
    const [integration] = await db.query(
      'SELECT * FROM users_integrations WHERE user_id = ? AND service_name = ? AND is_connected = true',
      [userId, service]
    );
    
    if (!integration.length) {
      return res.status(400).json({
        success: false,
        message: 'Integration not connected'
      });
    }
    
    // Sync devices based on service
    const syncResult = await syncDevicesWithService(service, devices, integration[0]);
    
    if (syncResult.success) {
      // Update last sync time
      await db.query(
        'UPDATE users_integrations SET last_sync = NOW() WHERE user_id = ? AND service_name = ?',
        [userId, service]
      );
    }
    
    res.json(syncResult);
  } catch (error) {
    console.error('Error syncing devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync devices',
      error: error.message
    });
  }
};

async function syncDevicesWithService(service, devices, integration) {
  const config = JSON.parse(integration.config || '{}');
  
  try {
    switch (service) {
      case 'google':
        // Sync with Google Assistant
        console.log('Syncing', devices.length, 'devices with Google Assistant');
        break;
      case 'alexa':
        // Sync with Alexa
        console.log('Syncing', devices.length, 'devices with Alexa');
        break;
      case 'homekit':
        // Sync with HomeKit
        console.log('Syncing', devices.length, 'devices with HomeKit');
        break;
      case 'smartthings':
        // Sync with SmartThings
        console.log('Syncing', devices.length, 'devices with SmartThings');
        break;
    }
    
    return {
      success: true,
      message: `Successfully synced ${devices.length} devices with ${service}`,
      syncedDevices: devices.length
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to sync devices with ${service}: ${error.message}`
    };
  }
}