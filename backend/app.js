require('dotenv').config();
require('./services/mqttClient');


const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');
const pool = require('./db');
const path = require('path');
const app = express();


// ✅ Routes
const authRoutes = require('./routes/authRoutes');
const mqttRoutes = require('./routes/mqttRoutes');
const userRoutes = require('./routes/userRoutes'); 
const feedbackRoutes = require('./routes/feedbackRoutes');

// ✅ Check MySQL DB connection
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ Failed to connect to MySQL DB:', err.code, err.message);
  } else {
    console.log('✅ MySQL DB connected successfully!');
    conn.release();
  }
});



// ✅ Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/mqtt', mqttRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedback', require('./routes/feedbackRoutes'));
// ⬇️ Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ⬇️ Register avatar upload route
const uploadAvatarRoute = require('./routes/uploadAvatar');
const profileRoutes = require('./routes/profileRoutes');

app.use('/api/profile', uploadAvatarRoute); // URL will be /api/profile/upload-avatar
app.use('/api/profile', profileRoutes);  // ✅ handles GET /api/profile


// ✅ Test route
app.get('/', (req, res) => {
  res.send('HavenSync Backend is Live!');
});

// ✅ Example device API
app.get('/devices', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM devices');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ✅ Use PORT=3001 for local, or Railway's assigned port
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
