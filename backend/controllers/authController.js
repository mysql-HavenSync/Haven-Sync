const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');

function generateUserId(name, email) {
  const firstName = name.trim().split(' ')[0].toUpperCase();
  const emailPrefix = email.trim().split('@')[0].slice(0, 3).toUpperCase();

  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const dateCode = `${yy}${mm}${dd}${hh}${min}`;
  return `HS-${firstName}-${emailPrefix}-${dateCode}`;
}

// ✅ Generate unique Parent ID
function generateParentId(email) {
  const emailPrefix = email.trim().split('@')[0].slice(0, 4).toUpperCase();
  const emailDomain = email.trim().split('@')[1].slice(0, 3).toUpperCase();
  
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');

  const dateCode = `${yy}${mm}${dd}${hh}${min}${sec}`;
  return `PAR-${emailPrefix}-${emailDomain}-${dateCode}`;
}

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
    const user_id = generateUserId(name, email);
    const parent_user_id = generateParentId(email);

    // 🔍 DEBUG: Log generated values
    console.log('🔍 DEBUG - Generated user_id:', user_id);
    console.log('🔍 DEBUG - Generated parent_user_id:', parent_user_id);
    console.log('🔍 DEBUG - About to insert:', { name, email, user_id, parent_user_id });

    // First, let's check what columns exist in the users table
    console.log('🔍 DEBUG - Checking table structure...');
    const [columns] = await db.query('DESCRIBE users');
    console.log('🔍 DEBUG - Users table columns:', columns.map(col => col.Field));

    // ✅ FIX: Assign 'Admin' role to new signups by default
    const userRole = 'Admin'; // This makes every new signup an Admin who can add subusers
    
    // Try inserting with explicit column names including role
    const insertQuery = 'INSERT INTO users (name, email, password, user_id, parent_user_id, role) VALUES (?, ?, ?, ?, ?, ?)';
    
    console.log('🔍 DEBUG - Insert query:', insertQuery);
    console.log('🔍 DEBUG - Insert values:', [name, email, '[HIDDEN]', user_id, parent_user_id, userRole]);

    const result = await db.query(insertQuery, [name, email, hashedPassword, user_id, parent_user_id, userRole]);
    
    console.log('🔍 DEBUG - Insert result:', result);

    // Verify the insertion
    const [insertedUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('🔍 DEBUG - Inserted user data:', insertedUser[0]);

    res.json({ 
      message: 'User registered successfully',
      user_id: user_id,
      parent_user_id: parent_user_id,
      role: userRole, // ✅ Return the assigned role
      debug: {
        generated_user_id: user_id,
        generated_parent_user_id: parent_user_id,
        assigned_role: userRole,
        inserted_data: insertedUser[0]
      }
    });
  } catch (err) {
    console.error('❌ Signup error:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ error: 'Signup failed', details: err.message, stack: err.stack });
  }
};

// ✅ FIXED: Include user_id in JWT token and ensure role is included
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    // ✅ FIXED: Ensure role is included in JWT payload
    const token = jwt.sign({ 
      id: user.id, 
      user_id: user.user_id,
      email: user.email,
      role: user.role || 'Admin' // ✅ Fallback to Admin if role is null
    }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    console.log('🔍 JWT payload created:', { 
      id: user.id, 
      user_id: user.user_id, 
      email: user.email,
      role: user.role || 'Admin'
    });

    // ✅ Return full user info including role
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        parent_user_id: user.parent_user_id,
        name: user.name,
        email: user.email,
        role: user.role || 'Admin', // ✅ Ensure role is always returned
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
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