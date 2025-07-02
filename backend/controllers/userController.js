const db = require('../db');

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
