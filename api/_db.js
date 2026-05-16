const { Pool } = require('pg');

let pool;

function useLocalSsl(databaseUrl) {
  if (!databaseUrl) return true;
  try {
    const host = new URL(databaseUrl).hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
  } catch {
    return true;
  }
}

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    const ssl = useLocalSsl(connectionString)
      ? { rejectUnauthorized: false }
      : false;

    pool = new Pool({
      connectionString,
      ssl,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

module.exports = { getPool };
