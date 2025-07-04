// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const [rows] = await db.query(
      'SELECT email, name, dob, phone, avatar FROM user_profiles WHERE email = ?',
      [userEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
