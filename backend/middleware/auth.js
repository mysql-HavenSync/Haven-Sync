const jwt = require('jsonwebtoken');
const db = require('../db');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Decoded JWT:', decoded);

    // Get full user info from database
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = users[0];
    
    // Attach user info to request
    req.user = {
      id: user.id,
      user_id: user.user_id,
      parent_user_id: user.parent_user_id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    console.log('✅ Authenticated user:', req.user);
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

module.exports = auth;