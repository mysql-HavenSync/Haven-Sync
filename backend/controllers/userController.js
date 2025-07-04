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

// ✅ FIXED: Add subusers with role validation to prevent subusers from creating admins
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

    // ✅ NEW: Check if the current user is a subuser and prevent them from creating Admin accounts
    const currentUserRole = req.user.role || mainUser[0].role;
    const isCurrentUserSubuser = !!mainUser[0].parent_user_id; // If they have a parent_user_id, they're a subuser

    console.log('🔍 Current user role:', currentUserRole);
    console.log('🔍 Is current user a subuser:', isCurrentUserSubuser);

    // ✅ ROLE VALIDATION: Only main users (Admins) can create Admin accounts
    let assignedRole = role || 'User'; // Default to 'User' if no role specified

    if (assignedRole === 'Admin' && isCurrentUserSubuser) {
      console.log('❌ Subuser attempted to create Admin account');
      return res.status(403).json({ 
        message: 'Permission denied. Only main administrators can create Admin accounts. Subusers can only create User accounts.',
        allowedRoles: ['User']
      });
    }

    // ✅ ADDITIONAL VALIDATION: Only allow 'Admin' or 'User' roles
    if (!['Admin', 'User'].includes(assignedRole)) {
      return res.status(400).json({ 
        message: 'Invalid role. Only "Admin" or "User" roles are allowed.',
        allowedRoles: ['Admin', 'User']
      });
    }

    // ✅ FORCE USER ROLE: If current user is a subuser, always assign 'User' role regardless of what they requested
    if (isCurrentUserSubuser) {
      assignedRole = 'User';
      console.log('🔧 Forced role to User for subuser creation');
    }

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

      // ✅ Insert into users table with password and validated role
      await db.query(
        'INSERT INTO users (name, email, user_id, password, parent_user_id, role) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, subusersUserId, hashedPassword, parentUserId, assignedRole]
      );

      // ✅ FIXED: Insert into subusers table with correct column name (sub_user_id) and validated role
      await db.query(
        'INSERT INTO subusers (parent_user_id, sub_user_id, password, role) VALUES (?, ?, ?, ?)',
        [parentUserId, subusersUserId, hashedPassword, assignedRole]
      );

      await db.query('COMMIT');
      console.log('✅ subusers added successfully to both tables with role:', assignedRole);

      res.json({ 
        message: 'Subusers added successfully',
        subusers: {
          user_id: subusersUserId,
          name,
          email,
          role: assignedRole,
          parent_user_id: parentUserId
        },
        info: isCurrentUserSubuser ? 'Note: Subusers can only create User accounts, not Admin accounts.' : null
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

exports.removeSubuser = async (req, res) => {
  const userId = req.params.userId; // Can be numeric (id) or string (user_id)
  const requestingUserId = req.user.user_id || req.user.id;

  console.log('🗑️ Removing subuser with userId:', userId);
  console.log('🔍 Requested by user:', requestingUserId);

  let connection;
  try {
    let userToDelete;
    let actualUserId;

    // 1. Get user to delete by either ID or user_id
    if (!isNaN(userId)) {
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [parseInt(userId)]);
      if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
      userToDelete = rows[0];
      actualUserId = userToDelete.user_id;
    } else {
      const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
      if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
      userToDelete = rows[0];
      actualUserId = userToDelete.user_id;
    }

    // 2. Prevent main user deletion
    if (!userToDelete.parent_user_id) {
      return res.status(403).json({ message: 'Cannot remove main admin users. Only subusers can be removed.' });
    }

    // 3. Permission check
    const [requestingUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [requestingUserId]);
    const userParentId = userToDelete.parent_user_id;
    const reqParentId = requestingUser[0]?.parent_user_id;
    const hasPermission = reqParentId
      ? userParentId === reqParentId
      : userParentId === requestingUserId;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Permission denied. You can only remove subusers under your account.' });
    }

    // 4. Start transaction
    await db.query('START TRANSACTION');

    // 5. Delete from dependent tables first
    await db.query('DELETE FROM user_profiles WHERE email = ?', [userToDelete.email]);
    await db.query('DELETE FROM user_devices WHERE user_id = ?', [actualUserId]);
    await db.query('DELETE FROM subusers WHERE sub_user_id = ?', [actualUserId]);
    await db.query('DELETE FROM users WHERE user_id = ?', [actualUserId]);

    await db.query('COMMIT');
    console.log('✅ Subuser deleted:', actualUserId);

    return res.status(200).json({
      message: 'Subuser removed successfully',
      removedUser: {
        id: userToDelete.id,
        user_id: actualUserId,
        name: userToDelete.name,
        email: userToDelete.email
      }
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ Failed to remove subuser:', err);

    // Specific MySQL error handling
    let message = 'Failed to remove subuser';
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      message = 'Cannot delete user due to associated records in other tables.';
    }

    return res.status(500).json({
      message,
      error: err.message,
      code: err.code
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
