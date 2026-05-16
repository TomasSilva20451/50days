const { Pool } = require('pg');

let pool;

/** Vercel Storage / outros integradores expõem só POSTGRES_URL; suportamos ambos */
function databaseUrlFromEnv() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  );
}

function parsedHost(databaseUrl) {
  try {
    return new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function useLocalSsl(databaseUrl) {
  if (!databaseUrl) return true;
  const host = parsedHost(databaseUrl);
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
}

function assertNotLoopbackOnVercel(connectionString) {
  const deployed =
    process.env.VERCEL === '1' &&
    (process.env.VERCEL_ENV === 'production' ||
      process.env.VERCEL_ENV === 'preview');
  const host = parsedHost(connectionString);
  const loopback =
    host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!deployed || !loopback) return;
  throw new Error(
    'DATABASE_URL aponta para localhost; na Vercel define um Postgres na cloud ' +
      '(DATABASE_URL ou POSTGRES_URL com hostname real — ex. Neon, Supabase ou Vercel Storage).'
  );
}

function getPool() {
  if (!pool) {
    const connectionString = databaseUrlFromEnv();
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL não está definido. Para produção usa um Postgres hospedado (Neon, Supabase, Railway, etc.).'
      );
    }

    assertNotLoopbackOnVercel(connectionString);

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
