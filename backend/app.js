const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  console.log('📋 Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// Import routes with error handling
let deviceRoutes;
try {
  console.log('🔍 Loading deviceRoutes...');
  deviceRoutes = require('./routes/deviceRoutes');
  console.log('📱 Device routes file loaded successfully');
} catch (error) {
  console.error('❌ Error loading device routes:', error);
  process.exit(1);
}

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Use routes
app.use('/api/devices', deviceRoutes);
console.log('📱 Device routes registered at /api/devices');

// List all registered routes (safe)
if (app._router && app._router.stack) {
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      console.log(`🛣️  Route: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          console.log(`🛣️  Router Route: ${Object.keys(handler.route.methods)} /api/devices${handler.route.path}`);
        }
      });
    }
  });
} else {
  console.warn('⚠️ No routes found at startup');
}



// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: 'Route not found',
    requested: `${req.method} ${req.url}`,
    availableRoutes: [
      'GET /test',
      'POST /api/devices/register',
      'GET /api/devices/test'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔍 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📱 Device register endpoint: http://localhost:${PORT}/api/devices/register`);
});

module.exports = app;