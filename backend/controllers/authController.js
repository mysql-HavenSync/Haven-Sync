const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');
const { generateUserId, generateParentId } = require('../utils/idGenerator');

exports.signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = generateUserId(name, normalizedEmail);
    const parent_user_id = generateParentId(normalizedEmail);
    const userRole = 'Admin';

    const insertQuery = 'INSERT INTO users (name, email, password, user_id, parent_user_id, role) VALUES (?, ?, ?, ?, ?, ?)';
    const result = await db.query(insertQuery, [name, normalizedEmail, hashedPassword, user_id, parent_user_id, userRole]);

    const [insertedUser] = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    res.json({ 
      message: 'User registered successfully',
      user_id,
      parent_user_id,
      role: userRole,
      debug: {
        generated_user_id: user_id,
        generated_parent_user_id: parent_user_id,
        assigned_role: userRole,
        inserted_data: insertedUser[0]
      }
    });
  } catch (err) {
    console.error('❌ Signup error:', err);
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign({ 
      id: user.id, 
      user_id: user.user_id,
      email: user.email,
      role: user.role || 'Admin'
    }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        parent_user_id: user.parent_user_id,
        name: user.name,
        email: user.email,
        role: user.role || 'Admin',
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = users[0].id;
    await db.query('INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, ?)', [userId, otp, expiresAt]);
    await sendMail(normalizedEmail, `Your HavenSync OTP is: ${otp}`);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('❌ Error in OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = users[0].id;

    const [rows] = await db.query('SELECT * FROM otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
    if (!rows.length || rows[0].otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(rows[0].expires_at)) {
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
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Email and both password fields are required' });
  }

  if (newPassword !== confirmPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password mismatch or too short' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashed, normalizedEmail]);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed', details: err.message });
  }
};
