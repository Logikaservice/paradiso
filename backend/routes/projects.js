const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

/**
 * Lista progetti: per admin/tecnico tutti, per cliente solo quelli in enabled_projects.
 */
module.exports = (pool) => {
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, slug, name, description, icon, url, sort_order FROM projects ORDER BY sort_order, name'
      );
      let list = result.rows;
      const ruolo = req.user.ruolo;
      const enabled = req.user.enabled_projects || ['dashboard'];
      if (ruolo !== 'admin' && ruolo !== 'tecnico') {
        list = list.filter((p) => enabled.includes(p.slug));
      }
      res.json(list);
    } catch (e) {
      console.error('List projects:', e);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  router.get('/available', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, slug, name FROM projects ORDER BY sort_order, name'
      );
      res.json(result.rows);
    } catch (e) {
      console.error('Available projects:', e);
      res.status(500).json({ error: 'Errore interno' });
    }
  });

  return router;
};
