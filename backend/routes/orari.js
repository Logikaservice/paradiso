// routes/orari.js - Sistema Orari e Turni (identico a TicketApp, DB Paradiso)
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

module.exports = (pool) => {
  const requireOrariAccess = (req, res, next) => {
    if (req.user?.ruolo === 'admin' || req.user?.ruolo === 'tecnico') return next();
    const enabled = req.user?.enabled_projects || [];
    if (enabled.includes('orari') || enabled.includes('orari-turni')) return next();
    return res.status(403).json({
      error: 'Accesso negato: non hai i permessi per il modulo Orari e Turni',
      code: 'ORARI_ACCESS_DENIED',
    });
  };

  const initOrariTable = async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orari_data (
          id SERIAL PRIMARY KEY,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      const check = await pool.query('SELECT COUNT(*) FROM orari_data');
      if (parseInt(check.rows[0].count, 10) === 0) {
        const initialData = {
          companies: ['La Torre', 'Mercurio', 'Albatros'],
          departments: { 'La Torre': ['Cucina'], 'Mercurio': ['Cucina'], 'Albatros': ['Cucina'] },
          employees: { 'La Torre-Cucina': [], 'Mercurio-Cucina': [], 'Albatros-Cucina': [] },
          schedule: {},
          timeCodes: { 'R': 'Riposo', 'F': 'Ferie', 'M': 'Malattia', 'P': 'Permesso', 'I': 'Infortunio', 'AT': 'Atripalda', 'AV': 'Avellino', 'L': 'Lioni' },
          timeCodesOrder: ['R', 'F', 'M', 'P', 'I', 'AT', 'AV', 'L']
        };
        await pool.query('INSERT INTO orari_data (data) VALUES ($1::jsonb)', [JSON.stringify(initialData)]);
      }
    } catch (err) {
      console.error('Errore init orari_data:', err);
    }
  };
  initOrariTable();

  router.get('/data', authenticateToken, requireOrariAccess, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, data, updated_at FROM orari_data ORDER BY id DESC LIMIT 1');
      if (result.rows.length === 0) {
        const initialData = {
          companies: ['La Torre', 'Mercurio', 'Albatros'],
          departments: { 'La Torre': ['Cucina'], 'Mercurio': ['Cucina'], 'Albatros': ['Cucina'] },
          employees: { 'La Torre-Cucina': [], 'Mercurio-Cucina': [], 'Albatros-Cucina': [] },
          schedule: {},
          timeCodes: { 'R': 'Riposo', 'F': 'Ferie', 'M': 'Malattia', 'P': 'Permesso', 'I': 'Infortunio', 'AT': 'Atripalda', 'AV': 'Avellino', 'L': 'Lioni' },
          timeCodesOrder: ['R', 'F', 'M', 'P', 'I', 'AT', 'AV', 'L']
        };
        await pool.query('INSERT INTO orari_data (data) VALUES ($1::jsonb)', [JSON.stringify(initialData)]);
        return res.json(initialData);
      }
      const data = result.rows[0].data || { companies: [], departments: {}, employees: {}, schedule: {}, timeCodes: {}, timeCodesOrder: [] };
      res.json(data);
    } catch (err) {
      console.error('Errore lettura orari:', err);
      res.status(500).json({ error: 'Errore lettura dati' });
    }
  });

  router.get('/debug', async (req, res) => {
    try {
      const result = await pool.query('SELECT id, updated_at FROM orari_data ORDER BY id DESC LIMIT 1');
      if (result.rows.length === 0) return res.json({ exists: false });
      res.json({ exists: true, recordId: result.rows[0].id, updatedAt: result.rows[0].updated_at });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/save', authenticateToken, requireOrariAccess, async (req, res) => {
    try {
      const { companies, departments, employees, schedule, timeCodes, timeCodesOrder } = req.body;
      const cleanData = JSON.parse(JSON.stringify({
        companies: companies || [],
        departments: departments || {},
        employees: employees || {},
        schedule: schedule || {},
        timeCodes: timeCodes || {},
        timeCodesOrder: timeCodesOrder || []
      }));
      const check = await pool.query('SELECT id FROM orari_data ORDER BY id DESC LIMIT 1');
      if (check.rows.length > 0) {
        await pool.query('UPDATE orari_data SET data = $1::jsonb, updated_at = NOW() WHERE id = $2', [JSON.stringify(cleanData), check.rows[0].id]);
      } else {
        await pool.query('INSERT INTO orari_data (data) VALUES ($1::jsonb)', [JSON.stringify(cleanData)]);
      }
      res.json({ success: true, message: 'Dati salvati con successo' });
    } catch (err) {
      console.error('Errore salvataggio orari:', err);
      res.status(500).json({ error: 'Errore salvataggio dati', details: err.message });
    }
  });

  return router;
};
