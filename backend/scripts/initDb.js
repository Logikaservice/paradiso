/**
 * Crea tabelle e dati iniziali. Esegui: node scripts/initDb.js
 * Richiede .env con DATABASE_URL o PG_* configurati.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../utils/db');
const { hashPassword } = require('../utils/passwordUtils');

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        ruolo VARCHAR(50) NOT NULL DEFAULT 'cliente',
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255) NOT NULL,
        enabled_projects JSONB DEFAULT '["dashboard"]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Tabella users ok');

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        url VARCHAR(500),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Tabella projects ok');

    const { rows: existing } = await client.query('SELECT id FROM projects LIMIT 1');
    if (existing.length === 0) {
      await client.query(`
        INSERT INTO projects (slug, name, description, icon, url, sort_order) VALUES
        ('dashboard', 'Dashboard', 'Vista principale e accesso ai progetti', 'LayoutDashboard', '/', 0),
        ('orari-turni', 'Orari e Turni', 'Gestione orari e turni dipendenti', 'Clock', '/orari-turni', 1);
      `);
      console.log('Progetti iniziali creati (dashboard, orari-turni)');
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@paradiso.local';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    const { rows: adminExists } = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminExists.length === 0) {
      const hashed = await hashPassword(adminPass);
      await client.query(
        `INSERT INTO users (email, password, ruolo, nome, cognome, enabled_projects)
         VALUES ($1, $2, 'admin', 'Admin', 'Sistema', '["dashboard","orari-turni"]'::jsonb)`,
        [adminEmail, hashed]
      );
      console.log('Utente admin creato:', adminEmail, '(password:', adminPass, ')');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
