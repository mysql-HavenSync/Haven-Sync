require('dotenv').config();
require('./services/mqttClient'); // Import MQTT client at top

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const app = express(); // ✅ Initialize app before using it

// ✅ Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ✅ Routes
const authRoutes = require('./routes/authRoutes');
const mqttRoutes = require('./routes/mqttRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/mqtt', mqttRoutes);

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

// ✅ Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
