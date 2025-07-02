const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');

// controllers/authController.js (signup)
exports.signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert with user_id = NULL for main user
    await db.query(
      'INSERT INTO users (name, email, password, user_id) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, null]
    );

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
};



exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // ✅ Return full user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'User',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};


exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  console.log('📨 OTP requested for:', email);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now

  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.log('❌ No user found:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = users[0].id;
    console.log('✅ Found user ID:', userId);

    await db.query(
      'INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
      [userId, otp, expiresAt]
    );
    console.log('🔐 OTP saved:', otp);

    await sendMail(email, `Your HavenSync OTP is: ${otp}`);
    console.log('✅ Email sent to:', email);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('❌ Error in OTP:', err.message);
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
};



exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // 1. Get user_id
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = users[0].id;

    // 2. Get latest OTP for this user
    const [rows] = await db.query(
      'SELECT * FROM otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'No OTP found for this user' });
    }

    const latestOtp = rows[0];

    // 3. Check OTP and expiry
    if (latestOtp.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const now = new Date();
    if (now > new Date(latestOtp.expires_at)) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'OTP verification failed', details: err.message });
  }
};



exports.resetPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ message: 'Email is missing in query' });
  }

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Both fields are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed', details: err.message });
  }
};
