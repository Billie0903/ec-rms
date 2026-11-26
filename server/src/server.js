import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function start() {
  await pool.query('SELECT 1'); // fail fast if the database isn't reachable
  app.listen(env.port, () => {
    console.log(`EC-RMS API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start the server:', err.message);
  process.exit(1);
});
