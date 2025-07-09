const express = require('express');
const router = express.Router();
const db = require('../db');

// Import auth middleware with error handling
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
  console.log('🔐 Auth middleware loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth middleware:', error);
  // Create a dummy middleware for testing
  authMiddleware = (req, res, next) => {
    console.log('⚠️  Using dummy auth middleware - auth.js not found');
    req.user = { id: 1, user_id: 1, name: 'Test User', email: 'test@example.com' };
    next();
  };
}

// Debug route (no auth required)
router.get('/test', (req, res) => {
  console.log('🧪 Test route accessed');
  res.json({ 
    message: 'Device routes are working!',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/devices/test',
      'POST /api/devices/register'
    ]
  });
});

// Device registration route
router.post('/register', authMiddleware, async (req, res) => {
  console.log('📱 Device registration attempt');
  console.log('👤 User from auth:', req.user);
  console.log('📦 Request body:', req.body);
  
  try {
    const { device_id, device_name, device_type, device_uid } = req.body;
    const user_id = req.user.user_id || req.user.id;

    // Validate required fields
    if (!device_id || !device_name || !device_type) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['device_id', 'device_name', 'device_type'],
        received: Object.keys(req.body)
      });
    }

    console.log('🔍 Checking if device already exists...');
    
    // Check if device already exists
    const [existingDevices] = await db.query(
      'SELECT * FROM devices WHERE device_id = ? OR device_uid = ?',
      [device_id, device_uid || device_id]
    );

    if (existingDevices.length > 0) {
      console.log('⚠️  Device already exists:', existingDevices[0]);
      return res.status(409).json({ 
        message: 'Device already registered',
        existing_device: {
          id: existingDevices[0].id,
          device_id: existingDevices[0].device_id,
          device_name: existingDevices[0].device_name
        }
      });
    }

    console.log('💾 Inserting new device into database...');

    // Insert new device
    const [result] = await db.query(
      `INSERT INTO devices (device_id, device_name, device_type, device_uid, user_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [device_id, device_name, device_type, device_uid || device_id, user_id]
    );

    console.log('✅ Device registered successfully:', result);

    // Get the inserted device
    const [newDevice] = await db.query('SELECT * FROM devices WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Device registered successfully',
      device: {
        id: newDevice[0].id,
        device_id: newDevice[0].device_id,
        device_name: newDevice[0].device_name,
        device_type: newDevice[0].device_type,
        device_uid: newDevice[0].device_uid,
        status: newDevice[0].status,
        created_at: newDevice[0].created_at
      }
    });

  } catch (error) {
    console.error('💥 Database error in device registration:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Get user's devices
router.get('/', authMiddleware, async (req, res) => {
  console.log('📱 Get devices request');
  console.log('👤 User:', req.user);
  
  try {
    const user_id = req.user.user_id || req.user.id;
    
    const [devices] = await db.query(
      'SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );

    console.log(`📱 Found ${devices.length} devices for user ${user_id}`);

    res.json({
      message: 'Devices retrieved successfully',
      devices: devices.map(device => ({
        id: device.id,
        device_id: device.device_id,
        device_name: device.device_name,
        device_type: device.device_type,
        device_uid: device.device_uid,
        status: device.status,
        created_at: device.created_at,
        updated_at: device.updated_at
      }))
    });

  } catch (error) {
    console.error('💥 Error fetching devices:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Debug: List all routes in this router
console.log('📱 Available device routes:');
router.stack.forEach((layer) => {
  if (layer.route) {
    console.log(`   ${Object.keys(layer.route.methods).join(', ').toUpperCase()} /api/devices${layer.route.path}`);
  }
});

module.exports = router;