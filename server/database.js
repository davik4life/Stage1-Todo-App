// Connections may be reused; task/note data must always be read from PostgreSQL.
let database;
async function query(text, values = []) {
  if (!database) {
    if (process.env.NETLIFY === 'true' || process.env.NETLIFY_DB_URL) {
      const { getDatabase } = await import('@netlify/database');
      database = getDatabase();
    } else if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      database = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 10000,
      });
      database.on('error', () => console.error('Idle database connection failed'));
    } else {
      throw new Error('Configure a PostgreSQL database before starting TaskFlow');
    }
  }
  if (database.sql) return { rows: await database.sql.unsafe(text, values) };
  return database.query(text, values);
}
module.exports = { query };
