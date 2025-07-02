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

// ✅ Add sub_user under main user (SIMPLIFIED VERSION)
exports.addsub_user = async (req, res) => {
  const { name, email, mainUserId, role } = req.body;

  console.log('📝 Adding sub-user:', { name, email, mainUserId, role });

  try {
    // Validate required fields
    if (!name || !email || !mainUserId) {
      return res.status(400).json({ message: 'Name, email, and mainUserId are required' });
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
    
    // Option 1: If you have parent_user_id column
    /*
    await db.query(
      'INSERT INTO users (name, email, user_id, role, parent_user_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, subUserUserId, role || 'User', mainUserId]
    );
    */

    // Option 2: If you DON'T have parent_user_id column (use this for now)
    // We'll store the relationship in a separate table or use a naming convention
    await db.query(
      'INSERT INTO users (name, email, user_id, role, password) VALUES (?, ?, ?, ?, ?)',
      [name, email, subUserUserId, role || 'User', null] // password is null for sub-users
    );

    // Create a record in user_relationships table to track parent-child relationship
    await db.query(
      'INSERT INTO user_relationships (parent_user_id, child_user_id, relationship_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP',
      [mainUserId, subUserUserId, 'sub_user']
    );

    console.log('✅ Sub-user added successfully');
    res.json({ message: 'sub_user added successfully' });
  } catch (err) {
    console.error('❌ Error adding sub-user:', err);
    res.status(500).json({ message: 'Failed to add sub_user', error: err.message });
  }
};

// ✅ Get sub_users for the logged-in user only
exports.getsub_users = async (req, res) => {
  const mainUserId = req.user.user_id; // Get user_id from JWT token
  
  console.log('🔍 Fetching sub-users for main user:', mainUserId);

  try {
    // Query using the relationships table
    const [sub_users] = await db.query(`
      SELECT u.* FROM users u
      INNER JOIN user_relationships ur ON u.user_id = ur.child_user_id
      WHERE ur.parent_user_id = ? AND ur.relationship_type = 'sub_user'
    `, [mainUserId]);
    
    console.log('✅ Found sub-users:', sub_users.length);
    res.json({ sub_users });
  } catch (err) {
    console.error('❌ Error fetching sub_users:', err);
    res.status(500).json({ message: 'Error fetching sub_users', error: err.message });
  }
};

// ✅ Assign device to a sub_user
exports.assignDevice = async (req, res) => {
  const { userId, deviceId } = req.body;

  try {
    await db.query(
      'INSERT INTO user_devices (user_id, device_id) VALUES (?, ?)',
      [userId, deviceId]
    );

    res.json({ message: 'Device assigned successfully' });
  } catch (err) {
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
    const message = `Your HavenSync verification OTP is: ${otp}. This code will expire in 5 minutes.`;
    await sendMail(email, message);

    console.log('✅ OTP sent to:', email);
    res.json({ message: 'OTP sent to sub-user email successfully' });
  } catch (err) {
    console.error('❌ OTP Email sending failed:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};