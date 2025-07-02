const db = require('../db');
const sendMail = require('../utils/sendMail');

// Helper function to generate unique user_id for sub-users
function generateSubUserId(name, email) {
  const firstName = name.trim().split(' ')[0].toUpperCase();
  const emailPrefix = email.trim().split('@')[0].slice(0, 3).toUpperCase();

  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');

  const dateCode = `${yy}${mm}${dd}${hh}${min}${sec}`;
  return `HS-SUB-${firstName}-${emailPrefix}-${dateCode}`;
}

// ✅ FIXED: Add sub_user under main user
exports.addsub_user = async (req, res) => {
  const { name, email, mainUserId, role } = req.body;

  console.log('📝 Adding sub-user:', { name, email, mainUserId, role });
  console.log('🔍 Request user from JWT:', req.user);

  try {
    // Validate required fields
    if (!name || !email || !mainUserId) {
      return res.status(400).json({ message: 'Name, email, and mainUserId are required' });
    }

    // ✅ SECURITY: Verify that the requester is authorized to add sub-users for this mainUserId
    if (req.user.user_id !== mainUserId) {
      return res.status(403).json({ message: 'You can only add sub-users for your own account' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Verify that the main user exists
    const [mainUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [mainUserId]);
    if (mainUser.length === 0) {
      return res.status(400).json({ message: 'Main user not found' });
    }

    // Generate unique user_id for sub-user
    const subUserUserId = generateSubUserId(name, email);
    
    // Insert the sub-user
    await db.query(
      'INSERT INTO users (name, email, user_id, role, password) VALUES (?, ?, ?, ?, ?)',
      [name, email, subUserUserId, role || 'User', null] // password is null for sub-users
    );

    // Create a record in user_relationships table to track parent-child relationship
    // ✅ First, check if table exists, if not create it
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_relationships (
          id INT AUTO_INCREMENT PRIMARY KEY,
          parent_user_id VARCHAR(255) NOT NULL,
          child_user_id VARCHAR(255) NOT NULL,
          relationship_type VARCHAR(50) NOT NULL DEFAULT 'sub_user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_relationship (parent_user_id, child_user_id)
        )
      `);
    } catch (tableError) {
      console.log('⚠️ Table might already exist or creation failed:', tableError.message);
    }

    await db.query(
      'INSERT INTO user_relationships (parent_user_id, child_user_id, relationship_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP',
      [mainUserId, subUserUserId, 'sub_user']
    );

    console.log('✅ Sub-user added successfully');
    res.json({ 
      message: 'Sub-user added successfully',
      subUser: {
        user_id: subUserUserId,
        name,
        email,
        role: role || 'User'
      }
    });
  } catch (err) {
    console.error('❌ Error adding sub-user:', err);
    res.status(500).json({ message: 'Failed to add sub_user', error: err.message });
  }
};

// ✅ FIXED: Get sub_users for the logged-in user only
exports.getsub_users = async (req, res) => {
  console.log('🔍 Request user from JWT:', req.user);
  
  // ✅ FIXED: Extract user_id properly from JWT payload
  const mainUserId = req.user.user_id || req.user.id;
  
  if (!mainUserId) {
    console.error('❌ No user_id found in JWT token');
    return res.status(401).json({ message: 'Invalid token: missing user_id' });
  }
  
  console.log('🔍 Fetching sub-users for main user:', mainUserId);

  try {
    // ✅ First, try to get sub-users using the relationship table
    let sub_users = [];
    
    try {
      const [relationshipUsers] = await db.query(`
        SELECT u.id, u.name, u.email, u.user_id, u.role, ur.created_at as added_date
        FROM users u
        INNER JOIN user_relationships ur ON u.user_id = ur.child_user_id
        WHERE ur.parent_user_id = ? AND ur.relationship_type = 'sub_user'
        ORDER BY ur.created_at DESC
      `, [mainUserId]);
      
      sub_users = relationshipUsers;
    } catch (relationError) {
      console.log('⚠️ Relationship table query failed, trying fallback method:', relationError.message);
      
      // ✅ Fallback: If relationship table doesn't exist, try to get sub-users by naming convention
      const [fallbackUsers] = await db.query(`
        SELECT id, name, email, user_id, role, created_at as added_date
        FROM users 
        WHERE user_id LIKE 'HS-SUB-%' AND user_id != ?
        ORDER BY created_at DESC
      `, [mainUserId]);
      
      sub_users = fallbackUsers;
    }
    
    // ✅ Format the response properly
    const formattedSubUsers = sub_users.map(user => ({
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role || 'User',
      active: true,
      addedBy: 'Admin',
      added_date: user.added_date
    }));
    
    console.log('✅ Found sub-users:', formattedSubUsers.length);
    res.json({ sub_users: formattedSubUsers });
  } catch (err) {
    console.error('❌ Error fetching sub_users:', err);
    res.status(500).json({ message: 'Error fetching sub_users', error: err.message });
  }
};

// ✅ Assign device to a sub_user
exports.assignDevice = async (req, res) => {
  const { userId, deviceId } = req.body;

  try {
    // ✅ Create table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_assignment (user_id, device_id)
      )
    `);

    await db.query(
      'INSERT INTO user_devices (user_id, device_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
      [userId, deviceId]
    );

    res.json({ message: 'Device assigned successfully' });
  } catch (err) {
    console.error('❌ Device assignment error:', err);
    res.status(500).json({ message: 'Failed to assign device', error: err.message });
  }
};

// ✅ Send OTP to sub-user during registration
exports.sendSubUserOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const subject = 'HavenSync - Sub-User Verification OTP';
    const message = `
      <h2>HavenSync Sub-User Verification</h2>
      <p>Your verification OTP is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
    `;
    
    await sendMail(email, message, subject);

    console.log('✅ OTP sent to:', email);
    res.json({ message: 'OTP sent to sub-user email successfully' });
  } catch (err) {
    console.error('❌ OTP Email sending failed:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};