const db = require('../db');
const sendMail = require('../utils/sendMail');

// controllers/usersController.js
exports.addSubUser = async (req, res) => {
  const mainUserId = req.user.id; // from JWT middleware
  const { name, email, role } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const password = await bcrypt.hash('default123', 10); // or generate temp pass

    // ✅ Insert with user_id set to main user's ID
    await db.query(
      'INSERT INTO users (name, email, password, role, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, role || 'User', mainUserId]
    );

    res.json({ message: 'Sub-user created successfully' });
  } catch (err) {
    console.error('❌ Error creating sub-user:', err);
    res.status(500).json({ message: 'Failed to create sub-user' });
  }
};

// ✅ Get sub_users by main user
exports.getsub_users = async (req, res) => {
  const { mainUserId } = req.query;

  try {
    const [sub_users] = await db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [mainUserId]
    );
    res.json({ sub_users });
  } catch (err) {
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
    const message = `Your OTP is: ${otp}`;
    await sendMail(email, message);

    res.json({ message: 'OTP sent to sub-user email successfully' });
  } catch (err) {
    console.error('❌ OTP Email sending failed:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};