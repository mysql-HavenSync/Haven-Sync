// routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// ✅ GET profile
router.get('/', authMiddleware, async (req, res) => {
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
    console.error('❌ Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ PUT profile (CREATE or UPDATE)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { name, dob, phone, avatar } = req.body;

    const [existing] = await db.query('SELECT id FROM user_profiles WHERE email = ?', [userEmail]);

    if (existing.length > 0) {
      await db.query(
        'UPDATE user_profiles SET name = ?, dob = ?, phone = ?, avatar = ? WHERE email = ?',
        [name, dob, phone, avatar, userEmail]
      );
    } else {
      await db.query(
        'INSERT INTO user_profiles (email, name, dob, phone, avatar) VALUES (?, ?, ?, ?, ?)',
        [userEmail, name, dob, phone, avatar]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});


// ✅ Avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/upload-avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

module.exports = router;
