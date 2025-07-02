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

// ✅ FIXED: Add sub_user using the correct table structure
exports.addsub_user = async (req, res) => {
  const { name, email, mainUserId, role } = req.body;

  console.log('📝 Adding sub-user:', { name, email, mainUserId, role });
  console.log('🔍 Request user from JWT:', req.user);

  try {
    // Validate required fields
    if (!name || !email || !mainUserId) {
      return res.status(400).json({ message: 'Name, email, and mainUserId are required' });
    }

    // ✅ FIXED: Get the parent_user_id from JWT token properly
    const jwtUserId = req.user.user_id || req.user.id;
    console.log('🔍 JWT user_id:', jwtUserId);
    console.log('🔍 mainUserId from request:', mainUserId);

    // ✅ SECURITY: Verify that the requester is authorized to add sub-users for this mainUserId
    if (jwtUserId !== mainUserId) {
      console.log('❌ Authorization failed: JWT user_id does not match mainUserId');
      return res.status(403).json({ message: 'You can only add sub-users for your own account' });
    }

    // Check if email already exists in users table
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Verify that the main user exists and get their parent_user_id
    const [mainUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [mainUserId]);
    if (mainUser.length === 0) {
      return res.status(400).json({ message: 'Main user not found' });
    }

    console.log('✅ Main user found:', mainUser[0]);
    const parentUserId = mainUser[0].parent_user_id; // This is what we'll use as main_user_id

    // Generate unique user_id for sub-user
    const subUserUserId = generateSubUserId(name, email);
    console.log('🔧 Generated sub-user ID:', subUserUserId);
    
    // ✅ OPTION 1: If you want to store sub-users in the separate subuser table
    try {
      // First, create the sub-user record in the users table (without password since they can't login independently)
      await db.query(
        'INSERT INTO users (name, email, user_id, role, password, parent_user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, subUserUserId, role || 'User', null, mainUserId]
      );

      // Then, create the relationship in the subuser table
      await db.query(
        'INSERT INTO subuser (main_user_id, sub_user_id, role) VALUES (?, ?, ?)',
        [parentUserId, subUserUserId, role || 'User']
      );

      console.log('✅ Sub-user added to both users and subuser tables');
    } catch (insertError) {
      console.error('❌ Insert error:', insertError);
      throw insertError;
    }

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
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: 'Failed to add sub_user', error: err.message, stack: err.stack });
  }
};

// ✅ FIXED: Get sub_users using the correct table structure
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
    // First, get the parent_user_id for this user
    const [mainUser] = await db.query('SELECT parent_user_id FROM users WHERE user_id = ?', [mainUserId]);
    if (mainUser.length === 0) {
      return res.status(404).json({ message: 'Main user not found' });
    }

    const parentUserId = mainUser[0].parent_user_id;
    console.log('🔍 Parent user ID:', parentUserId);

    // ✅ Query sub-users using the correct table structure
    const [subUsers] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_id,
        u.role,
        s.created_at as added_date
      FROM subuser s
      INNER JOIN users u ON s.sub_user_id = u.user_id
      WHERE s.main_user_id = ?
      ORDER BY s.created_at DESC
    `, [parentUserId]);
    
    console.log('✅ Found sub-users:', subUsers.length);
    
    // ✅ Format the response properly
    const formattedSubUsers = subUsers.map(user => ({
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role || 'User',
      active: true,
      addedBy: 'Admin',
      added_date: user.added_date
    }));
    
    console.log('✅ Returning sub-users:', formattedSubUsers.length);
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