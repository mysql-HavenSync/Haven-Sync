const db = require('../db');
const bcrypt = require('bcryptjs'); // ✅ ADD: Missing bcrypt import
const sendMail = require('../utils/sendMail');

// Helper function to generate unique user_id for subusers
function generateSubusersId(name, email) {
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

// ✅ FIXED: Add subusers with correct parent_user_id logic
exports.addsubusers = async (req, res) => {
  const { name, email, password, role } = req.body;

  console.log('📝 Adding subusers:', { name, email, role });
  console.log('🔍 Request user from JWT:', req.user);

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // ✅ FIXED: Get the JWT user_id properly
    const jwtUserId = req.user.user_id || req.user.id;
    console.log('🔍 JWT user_id:', jwtUserId);

    // Check if email already exists in users table
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Verify that the main user exists and get their parent_user_id
    const [mainUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [jwtUserId]);

    if (mainUser.length === 0) {
      return res.status(400).json({ message: 'Main user not found' });
    }

    console.log('✅ Main user found:', mainUser[0]);

    // 🔧 FIXED: Determine the correct parent_user_id
    let parentUserId;
    
    if (mainUser[0].parent_user_id) {
      // If current user has a parent_user_id, they are a subuser
      // New subuser should have the same parent as the current user
      parentUserId = mainUser[0].parent_user_id;
      console.log('📋 Current user is a subuser, using their parent_user_id:', parentUserId);
    } else {
      // If current user has no parent_user_id, they are the main user
      // New subuser's parent should be the current user
      parentUserId = mainUser[0].user_id;
      console.log('📋 Current user is main user, using their user_id as parent:', parentUserId);
    }

    // ✅ IMPORTANT: Verify that the parent_user_id exists in the users table
    const [parentUser] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [parentUserId]);
    if (parentUser.length === 0) {
      console.error('❌ Parent user not found in database:', parentUserId);
      return res.status(400).json({ 
        message: 'Parent user not found. Please contact support.',
        debug: `Parent ID: ${parentUserId}` 
      });
    }

    console.log('✅ Parent user verified:', parentUserId);

    // Generate unique user_id for subusers
    const subusersUserId = generateSubusersId(name, email);
    console.log('🔧 Generated subusers ID:', subusersUserId);
    
    // ✅ FIXED: Use database transaction for atomic operations
    await db.query('START TRANSACTION');

    try {
      // ✅ Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Insert into users table with password
      await db.query(
        'INSERT INTO users (name, email, user_id, password, parent_user_id) VALUES (?, ?, ?, ?, ?)',
        [name, email, subusersUserId, hashedPassword, parentUserId]
      );

      // ✅ FIXED: Insert into subusers table with correct column name (sub_user_id)
      await db.query(
        'INSERT INTO subusers (parent_user_id, sub_user_id, password, role) VALUES (?, ?, ?, ?)',
        [parentUserId, subusersUserId, hashedPassword, role || 'User']
      );

      await db.query('COMMIT');
      console.log('✅ subusers added successfully to both tables');

      res.json({ 
        message: 'Subusers added successfully',
        subusers: {
          user_id: subusersUserId,
          name,
          email,
          role: role || 'User',
          parent_user_id: parentUserId
        }
      });
    } catch (insertError) {
      await db.query('ROLLBACK');
      console.error('❌ Insert error, transaction rolled back:', insertError);
      throw insertError;
    }
  } catch (err) {
    console.error('❌ Error adding subusers:', err);
    console.error('❌ Error details:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to add subusers';
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Foreign key constraint failed. Parent user not found in database.';
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

// ✅ FIXED: Get subusers with correct column names and data structure
exports.getsubusers = async (req, res) => {
  console.log('🔍 Request user from JWT:', req.user);
  
  // ✅ FIXED: Extract user_id properly from JWT payload
  const mainUserId = req.user.user_id || req.user.id;
  
  if (!mainUserId) {
    console.error('❌ No user_id found in JWT token');
    return res.status(401).json({ message: 'Invalid token: missing user_id' });
  }
  
  console.log('🔍 Fetching subusers for main user:', mainUserId);

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

    // ✅ FIXED: Query subusers with correct column names and return proper data structure
    const [subusers] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_id,
        s.role,
        u.created_at,
        s.created_at as added_date,
        u.parent_user_id
      FROM subusers s
      INNER JOIN users u ON s.sub_user_id = u.user_id
      WHERE s.parent_user_id = ?
      ORDER BY s.created_at DESC
    `, [parentUserId]);
    
    console.log('✅ Found subusers:', subusers.length);
    console.log('🔍 Raw subusers data:', subusers);
    
    // ✅ FIXED: Format the response to match frontend expectations
    const formattedsubusers = subusers.map(user => ({
      id: user.id,                    // Database ID for frontend operations
      user_id: user.user_id,          // String user_id for API calls
      name: user.name,
      email: user.email,
      role: user.role || 'User',
      active: true,
      addedBy: 'Admin',
      created_at: user.created_at || user.added_date,
      parent_user_id: user.parent_user_id,
      isMainUser: false,              // All subusers are not main users
      sub_user_id: user.id           // Add this for compatibility
    }));
    
    console.log('✅ Formatted subusers:', formattedsubusers);
    res.json({ subusers: formattedsubusers });
  } catch (err) {
    console.error('❌ Error fetching subusers:', err);
    res.status(500).json({ 
      message: 'Error fetching subusers', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ✅ NEW: Remove/Delete subuser function
// ✅ FIXED: Remove/Delete subuser function
exports.removeSubuser = async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user.user_id || req.user.id;

  console.log('🗑️ Removing subuser with userId:', userId);
  console.log('🔍 Requested by user:', requestingUserId);
  console.log('🔍 userId type:', typeof userId);

  try {
    // ✅ FIXED: Handle both string user_id and numeric id
    let userToDelete;
    let actualUserId;

    // Check if userId is a number (database id) or string (user_id)
    if (!isNaN(userId)) {
      // If it's a number, query by id column
      console.log('🔍 Querying by database id:', userId);
      const [userByDbId] = await db.query('SELECT * FROM users WHERE id = ?', [parseInt(userId)]);
      if (userByDbId.length > 0) {
        userToDelete = userByDbId;
        actualUserId = userByDbId[0].user_id;
      }
    } else {
      // If it's a string, query by user_id column
      console.log('🔍 Querying by user_id:', userId);
      const [userByUserId] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
      if (userByUserId.length > 0) {
        userToDelete = userByUserId;
        actualUserId = userId;
      }
    }

    if (!userToDelete || userToDelete.length === 0) {
      console.log('❌ User not found with identifier:', userId);
      return res.status(404).json({ message: 'User not found. They may have already been removed.' });
    }

    const userRecord = userToDelete[0];
    console.log('✅ User found:', userRecord);
    console.log('✅ Actual user_id to delete:', actualUserId);

    // ✅ FIXED: Prevent deletion of main admin users
    if (!userRecord.parent_user_id) {
      console.log('❌ Attempted to delete main user/admin');
      return res.status(403).json({ message: 'Cannot remove main admin users. Only subusers can be removed.' });
    }

    // Verify that the requesting user has permission to delete this subuser
    const [requestingUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [requestingUserId]);
    if (requestingUser.length === 0) {
      return res.status(401).json({ message: 'Requesting user not found' });
    }

    // Check if the requesting user is the parent of the subuser or has admin privileges
    const userParentId = userRecord.parent_user_id;
    const requestingUserParentId = requestingUser[0].parent_user_id;

    let hasPermission = false;

    if (!requestingUserParentId) {
      // Requesting user is a main user, can delete their subusers
      hasPermission = userParentId === requestingUserId;
      console.log('🔍 Main user permission check:', { userParentId, requestingUserId, hasPermission });
    } else {
      // Requesting user is a subuser, can only delete subusers with the same parent
      hasPermission = userParentId === requestingUserParentId;
      console.log('🔍 Subuser permission check:', { userParentId, requestingUserParentId, hasPermission });
    }

    if (!hasPermission) {
      console.log('❌ Permission denied for user removal');
      return res.status(403).json({ message: 'Permission denied. You can only remove subusers under your account.' });
    }

    // ✅ Use database transaction for atomic operations
    await db.query('START TRANSACTION');

    try {
      // Delete from subusers table first (to avoid foreign key constraint issues)
      const [subusersDeleteResult] = await db.query('DELETE FROM subusers WHERE sub_user_id = ?', [actualUserId]);
      console.log('✅ Deleted from subusers table, affected rows:', subusersDeleteResult.affectedRows);

      // Delete from users table
      const [usersDeleteResult] = await db.query('DELETE FROM users WHERE user_id = ?', [actualUserId]);
      console.log('✅ Deleted from users table, affected rows:', usersDeleteResult.affectedRows);

      // Optional: Delete from user_devices table if exists
      try {
        const [devicesDeleteResult] = await db.query('DELETE FROM user_devices WHERE user_id = ?', [actualUserId]);
        console.log('✅ Deleted from user_devices table, affected rows:', devicesDeleteResult.affectedRows);
      } catch (deviceError) {
        console.log('⚠️ No user_devices table or no records to delete:', deviceError.message);
      }

      await db.query('COMMIT');
      console.log('✅ Subuser removed successfully');

      res.json({ 
        message: 'Subuser removed successfully',
        removedUser: {
          id: userRecord.id,
          user_id: actualUserId,
          name: userRecord.name,
          email: userRecord.email
        }
      });
    } catch (deleteError) {
      await db.query('ROLLBACK');
      console.error('❌ Delete error, transaction rolled back:', deleteError);
      throw deleteError;
    }
  } catch (err) {
    console.error('❌ Error removing subuser:', err);
    console.error('❌ Error details:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to remove subuser';
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      errorMessage = 'Cannot delete user. They may have associated data that needs to be removed first.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Foreign key constraint failed during deletion.';
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: err.message,
      code: err.code,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
// ✅ NEW: Get user details by user_id
exports.getUserDetails = async (req, res) => {
  const { userId } = req.params;
  
  console.log('🔍 Fetching user details for:', userId);
  
  try {
    const [user] = await db.query(
      'SELECT user_id, name, email, parent_user_id, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('✅ User details found:', user[0]);
    res.json(user[0]);
    
  } catch (err) {
    console.error('❌ Error fetching user details:', err);
    res.status(500).json({ 
      message: 'Error fetching user details', 
      error: err.message 
    });
  }
};

// ✅ Assign device to a subusers
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

// ✅ Send OTP to subusers during registration
exports.sendsubusersOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const subject = 'HavenSync - Subusers Verification OTP';
    const message = `
      <h2>HavenSync Subusers Verification</h2>
      <p>Your verification OTP is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
    `;
    
    await sendMail(email, message, subject);

    console.log('✅ OTP sent to:', email);
    res.json({ message: 'OTP sent to subusers email successfully' });
  } catch (err) {
    console.error('❌ OTP Email sending failed:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};