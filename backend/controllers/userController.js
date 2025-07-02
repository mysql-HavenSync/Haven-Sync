const db = require('../db');
const sendMail = require('../utils/sendMail');
// ✅ Add sub_user under main user
exports.addsub_user = async (req, res) => {
  const { name, email, mainUserId, role } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    await db.query(
      'INSERT INTO users (name, email, user_id, role) VALUES (?, ?, ?, ?)',
      [name, email, mainUserId, role || 'User']
    );

    res.json({ message: 'sub_user added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add sub_user', error: err.message });
  }
};

// ✅ Get sub_users by main user
exports.getSubUsers = async (req, res) => {
  try {
    const mainUserId = req.user.id; // assuming JWT middleware adds this

    const [subUsers] = await db.query('SELECT * FROM users WHERE user_id = ?', [mainUserId]);

    res.json({ sub_users: subUsers });
  } catch (err) {
    console.error('❌ Fetch sub-users error:', err);
    res.status(500).json({ message: 'Failed to fetch sub-users' });
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