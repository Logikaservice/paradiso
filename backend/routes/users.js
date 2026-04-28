const express = require('express');
const { hashPassword } = require('../utils/passwordUtils');
const { authenticateToken, requireAdminOrTecnico } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdminOrTecnico);

module.exports = (pool) => {
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, email, ruolo, nome, cognome, is_active, created_at,
                COALESCE(enabled_projects, '["dashboard"]'::jsonb) AS enabled_projects
         FROM users ORDER BY cognome, nome`
      );
      res.json(result.rows);
    } catch (e) {
      console.error('List users:', e);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `SELECT id, email, ruolo, nome, cognome, is_active, created_at,
                COALESCE(enabled_projects, '["dashboard"]'::jsonb) AS enabled_projects
         FROM users WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Utente non trovato' });
      res.json(result.rows[0]);
    } catch (e) {
      console.error('Get user:', e);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  router.post('/', async (req, res) => {
    const { email, password, ruolo, nome, cognome, enabled_projects, is_active } = req.body || {};
    if (!email || !password || !nome || !cognome) {
      return res.status(400).json({ error: 'Email, password, nome e cognome obbligatori' });
    }
    const projects = Array.isArray(enabled_projects) ? enabled_projects : ['dashboard'];
    try {
      const hashed = await hashPassword(password);
      const result = await pool.query(
        `INSERT INTO users (email, password, ruolo, nome, cognome, enabled_projects, is_active)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         RETURNING id, email, ruolo, nome, cognome, enabled_projects, is_active, created_at`,
        [
          email.trim().toLowerCase(),
          hashed,
          ruolo || 'cliente',
          nome,
          cognome,
          JSON.stringify(projects),
          is_active !== false,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'Email già esistente' });
      console.error('Create user:', e);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { email, password, ruolo, nome, cognome, enabled_projects, is_active } = req.body || {};
    try {
      const updates = [];
      const values = [];
      let idx = 1;
      if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email.trim().toLowerCase()); }
      if (nome !== undefined) { updates.push(`nome = $${idx++}`); values.push(nome); }
      if (cognome !== undefined) { updates.push(`cognome = $${idx++}`); values.push(cognome); }
      if (ruolo !== undefined) { updates.push(`ruolo = $${idx++}`); values.push(ruolo); }
      if (password !== undefined && password !== '') {
        const hashed = await hashPassword(password);
        updates.push(`password = $${idx++}`);
        values.push(hashed);
      }
      if (enabled_projects !== undefined) {
        const projects = Array.isArray(enabled_projects) ? enabled_projects : ['dashboard'];
        updates.push(`enabled_projects = $${idx++}::jsonb`);
        values.push(JSON.stringify(projects));
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${idx++}`);
        values.push(Boolean(is_active));
      }
      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nessun campo da aggiornare' });
      }
      values.push(id);
      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${idx}
         RETURNING id, email, ruolo, nome, cognome, enabled_projects, is_active, created_at, updated_at`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Utente non trovato' });
      res.json(result.rows[0]);
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'Email già esistente' });
      console.error('Update user:', e);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ error: 'Non puoi eliminare il tuo account' });
    }
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Utente non trovato' });
      res.json({ success: true });
    } catch (e) {
      console.error('Delete user:', e);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  return router;
};
