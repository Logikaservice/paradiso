const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { pool } = require('./utils/db');
const { ensureUsersSchema } = require('./utils/schema');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const projectsRoutes = require('./routes/projects');
const orariRoutes = require('./routes/orari')(pool);

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

app.use('/api/orari', orariRoutes);

// In produzione serve anche il frontend (stessa porta = niente CORS, /api funziona)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno' });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    await ensureUsersSchema(pool);
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
