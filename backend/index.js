const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { pool } = require('./utils/db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const projectsRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes(pool));
app.use('/api/projects', projectsRoutes(pool));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno' });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connesso');
  } catch (e) {
    console.error('Database non raggiungibile:', e.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log('Backend Paradiso in ascolto su port', PORT);
  });
}

start();
