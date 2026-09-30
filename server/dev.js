// Durable local PostgreSQL, isolated from the hosted database.
const { PGlite } = require('@electric-sql/pglite');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createApp } = require('./app');
const { createStore } = require('./store');

async function start() {
  const db = new PGlite(path.join(__dirname, '../.local-data'));
  const existing = await db.query("SELECT to_regclass('public.todos') AS table_name");
  if (!existing.rows[0].table_name) {
    await db.exec(readFileSync(path.join(__dirname, '../netlify/database/migrations/202609290001_create_workspace.sql'), 'utf8'));
  }
  const port = process.env.PORT || 5001;
  const server = createApp({ store: createStore((sql, values) => db.query(sql, values)) })
    .listen(port, () => console.log(`Local persistent workspace: http://localhost:${port}`));
  const stop = () => server.close(async () => { await db.close(); process.exit(0); });
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
start().catch(() => { console.error('Unable to start the local database'); process.exitCode = 1; });
