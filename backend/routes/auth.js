const express = require('express');
const { pool } = require('../utils/db');
const { comparePassword } = require('../utils/passwordUtils');
const { generateLoginResponse, verifyRefreshToken, extractTokenFromHeader } = require('../utils/jwtUtils');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password obbligatori' });
  }
  try {
    const result = await pool.query(
      `SELECT id, email, password, ruolo, nome, cognome,
              COALESCE(enabled_projects, '["dashboard"]'::jsonb) AS enabled_projects
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    const user = result.rows[0];
    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    const enabled = user.enabled_projects;
    const enabledProjects = Array.isArray(enabled) ? enabled : (enabled ? JSON.parse(enabled) : ['dashboard']);
    const payload = {
      ...user,
      enabled_projects: enabledProjects,
    };
    res.json(generateLoginResponse(payload));
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Errore interno' });
  }
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.body?.refreshToken || extractTokenFromHeader(req);
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token mancante' });
  }
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const result = await pool.query(
      `SELECT id, email, ruolo, nome, cognome,
              COALESCE(enabled_projects, '["dashboard"]'::jsonb) AS enabled_projects
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }
    const user = result.rows[0];
    const enabled = user.enabled_projects;
    user.enabled_projects = Array.isArray(enabled) ? enabled : (enabled ? JSON.parse(enabled) : ['dashboard']);
    res.json(generateLoginResponse(user));
  } catch (e) {
    return res.status(401).json({ error: e.message || 'Refresh token non valido' });
  }
});

module.exports = router;
