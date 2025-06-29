require('dotenv').config();
require('./services/mqttClient');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const app = express();

// ✅ MySQL DB Check
db.getConnection((err, conn) => {
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

// ✅ Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/mqtt', require('./routes/mqttRoutes'));

// ✅ Root Health Check
app.get('/', (req, res) => {
  res.send('HavenSync Backend is Live!');
});

// ✅ Example: Device List API
app.get('/devices', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM devices');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ✅ 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
