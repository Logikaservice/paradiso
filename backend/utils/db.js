const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let poolConfig = {};

if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (match) {
    poolConfig = {
      user: decodeURIComponent(match[1]),
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
      ssl: match[3] === 'localhost' || match[3] === '127.0.0.1' ? false : { rejectUnauthorized: false },
    };
  }
} else {
  poolConfig = {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432', 10),
    user: process.env.PG_USER || 'paradiso',
    password: process.env.PG_PASSWORD || 'password',
    database: process.env.PG_DATABASE || 'paradiso',
    ssl: false,
  };
}

const pool = new Pool(poolConfig);

module.exports = { pool };
