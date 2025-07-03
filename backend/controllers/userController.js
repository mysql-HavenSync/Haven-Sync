const db = require('../db');
const sendMail = require('../utils/sendMail');

// Helper function to generate unique user_id for sub_user
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

// ✅ FIXED: Add sub_user with correct database structure
exports.addsub_user = async (req, res) => {
  const { name, email, mainUserId, role } = req.body;

  console.log('📝 Adding sub_user:', { name, email, mainUserId, role });
  console.log('🔍 Request user from JWT:', req.user);

  try {
    // Validate required fields
    if (!name || !email || !mainUserId) {
      return res.status(400).json({ message: 'Name, email, and mainUserId are required' });
    }

    // ✅ FIXED: Get the JWT user_id properly
    const jwtUserId = req.user.user_id || req.user.id;
    console.log('🔍 JWT user_id:', jwtUserId);
    console.log('🔍 mainUserId from request:', mainUserId);

    // ✅ SECURITY: Verify that the requester is authorized to add sub_user for this mainUserId
    if (jwtUserId !== mainUserId) {
      console.log('❌ Authorization failed: JWT user_id does not match mainUserId');
      return res.status(403).json({ message: 'You can only add sub_user for your own account' });
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

    // 🔧 Get parent_user_id, fallback to main user's own user_id if null
    let parentUserId = mainUser[0].parent_user_id;
    if (!parentUserId) {
      console.warn('⚠️ parent_user_id is null, falling back to main user_id');
      parentUserId = mainUser[0].user_id;
    }

    console.log('🧾 Using parent_user_id:', parentUserId, 'for subuser insert');

    // Generate unique user_id for sub_user
    const subUserUserId = generateSubUserId(name, email);
    console.log('🔧 Generated sub_user ID:', subUserUserId);
    
    // ✅ FIXED: Use database transaction for atomic operations
    await db.query('START TRANSACTION');
    
    try {
      // ✅ FIXED: Insert sub_user into users table with correct parent_user_id
      await db.query(
        'INSERT INTO users (name, email, user_id, role, password, parent_user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, subUserUserId, role || 'User', null, parentUserId]
      );

      // ✅ FIXED: Create the relationship in the subuser table with correct column names
      // Based on your DB structure: parent_user_id, sub_user_id, role
      await db.query(
        'INSERT INTO subuser (parent_user_id, sub_user_id, role) VALUES (?, ?, ?)',
        [parentUserId, subUserUserId, role || 'User']
      );

      // Commit the transaction
      await db.query('COMMIT');
      console.log('✅ sub_user added successfully to both tables');
      
    } catch (insertError) {
      // Rollback on error
      await db.query('ROLLBACK');
      console.error('❌ Insert error, transaction rolled back:', insertError);
      throw insertError;
    }

    res.json({ 
      message: 'sub_user added successfully',
      subUser: {
        user_id: subUserUserId,
        name,
        email,
        role: role || 'User',
        parent_user_id: parentUserId
      }
    });
  } catch (err) {
    console.error('❌ Error adding sub_user:', err);
    console.error('❌ Error details:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to add sub_user';
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Foreign key constraint failed. Please check user relationships.';
    } else if (err.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Duplicate entry. This user may already exist.';
    } else if (err.code === 'ER_BAD_NULL_ERROR') {
      errorMessage = 'Required field is missing or null.';
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: err.message,
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ✅ FIXED: Get sub_users with correct column names
exports.getsub_users = async (req, res) => {
  console.log('🔍 Request user from JWT:', req.user);
  
  // ✅ FIXED: Extract user_id properly from JWT payload
  const mainUserId = req.user.user_id || req.user.id;
  
  if (!mainUserId) {
    console.error('❌ No user_id found in JWT token');
    return res.status(401).json({ message: 'Invalid token: missing user_id' });
  }
  
  console.log('🔍 Fetching sub_user for main user:', mainUserId);

  try {
    // First, get the parent_user_id for this user
    const [mainUser] = await db.query('SELECT parent_user_id FROM users WHERE user_id = ?', [mainUserId]);
    if (mainUser.length === 0) {
      return res.status(404).json({ message: 'Main user not found' });
    }

    let parentUserId = mainUser[0].parent_user_id;

    if (!parentUserId) {
      console.warn('⚠️ parent_user_id is null, falling back to main user_id');
      parentUserId = mainUserId;
    }

    // ✅ FIXED: Query sub_user with correct column names from your DB structure
    const [subUsers] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_id,
        u.role,
        u.created_at,
        s.created_at as added_date
      FROM subuser s
      INNER JOIN users u ON s.sub_user_id = u.user_id
      WHERE s.parent_user_id = ?
      ORDER BY s.created_at DESC
    `, [parentUserId]);
    
    console.log('✅ Found sub_user:', subUsers.length);
    
    // ✅ Format the response properly
    const formattedSubUsers = subUsers.map(user => ({
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role || 'User',
      active: true,
      addedBy: 'Admin',
      created_at: user.created_at || user.added_date
    }));
    
    console.log('✅ Returning sub_user:', formattedSubUsers.length);
    res.json({ sub_users: formattedSubUsers });
  } catch (err) {
    console.error('❌ Error fetching sub_users:', err);
    res.status(500).json({ 
      message: 'Error fetching sub_users', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

// ✅ Send OTP to sub_user during registration
exports.sendSubUserOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const subject = 'HavenSync - sub_user Verification OTP';
    const message = `
      <h2>HavenSync sub_user Verification</h2>
      <p>Your verification OTP is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
    `;
    
    await sendMail(email, message, subject);

    console.log('✅ OTP sent to:', email);
    res.json({ message: 'OTP sent to sub_user email successfully' });
  } catch (err) {
    console.error('❌ OTP Email sending failed:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};