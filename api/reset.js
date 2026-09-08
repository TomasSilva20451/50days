const { getPool } = require('./_db');
const { challengeConfig, todayKey } = require('./_config');

const DEFAULT_EVENTS = [
  { day_of_week: 0, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  { day_of_week: 0, time_label: 'Diário',     title: 'Abs',     color: '#c8f135', sort_order: 1 },
  { day_of_week: 1, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  { day_of_week: 1, time_label: 'Diário',     title: 'Abs',     color: '#c8f135', sort_order: 1 },
  { day_of_week: 2, time_label: '7h–9h',      title: 'Ténis',   color: '#4fc3f7', sort_order: 0 },
  { day_of_week: 2, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 1 },
  { day_of_week: 2, time_label: 'Diário',     title: 'Abs',     color: '#c8f135', sort_order: 2 },
  { day_of_week: 2, time_label: '18h',        title: 'Universidade', color: '#ce93d8', sort_order: 3 },
  { day_of_week: 3, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  { day_of_week: 3, time_label: 'Diário',     title: 'Abs',     color: '#c8f135', sort_order: 1 },
  { day_of_week: 3, time_label: '20h',        title: 'Jantar com amigos/família', color: '#f48fb1', sort_order: 2 },
  { day_of_week: 4, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  { day_of_week: 4, time_label: 'Diário',     title: 'Abs',     color: '#c8f135', sort_order: 1 },
  { day_of_week: 5, time_label: '7h–9h',      title: 'Ténis',   color: '#4fc3f7', sort_order: 0 },
  { day_of_week: 5, time_label: '10h+',       title: 'Ginásio', color: '#ff9800', sort_order: 1 },
  { day_of_week: 5, time_label: 'Diário',     title: 'Abs',     color: '#c8f135', sort_order: 2 },
  { day_of_week: 6, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  { day_of_week: 6, time_label: 'Diário',     title: 'Abs',     color: '#c8f135', sort_order: 1 },
];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const pool = getPool();
    const config = challengeConfig();
    const startDate = req.body?.start_date || todayKey();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${config.tables.days} (
        day_number INTEGER PRIMARY KEY,
        completed   BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        photo_data   TEXT,
        photo_name   VARCHAR(255),
        photo_added_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await pool.query(`ALTER TABLE ${config.tables.days} ADD COLUMN IF NOT EXISTS photo_data TEXT`);
    await pool.query(`ALTER TABLE ${config.tables.days} ADD COLUMN IF NOT EXISTS photo_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE ${config.tables.days} ADD COLUMN IF NOT EXISTS photo_added_at TIMESTAMP WITH TIME ZONE`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${config.tables.events} (
        id          SERIAL PRIMARY KEY,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        time_label  VARCHAR(30) NOT NULL,
        title       VARCHAR(255) NOT NULL,
        color       VARCHAR(20) DEFAULT '#c8f135',
        sort_order  INTEGER DEFAULT 0,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${config.tables.settings} (
        key   VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    for (const table of Object.values(config.tables)) {
      await pool.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await pool.query(`REVOKE ALL ON TABLE ${table} FROM anon, authenticated, PUBLIC`);
    }

    await pool.query(
      `INSERT INTO ${config.tables.settings} (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['start_date', startDate]
    );
    await pool.query(
      `INSERT INTO ${config.tables.settings} (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['total_days', String(config.totalDays)]
    );

    await pool.query(
      `INSERT INTO ${config.tables.days} (day_number)
       SELECT generate_series(1, $1)
       ON CONFLICT DO NOTHING`,
      [config.totalDays]
    );
    await pool.query(`DELETE FROM ${config.tables.days} WHERE day_number > $1`, [config.totalDays]);

    // Clear all day completions for the new challenge.
    await pool.query(
      `UPDATE ${config.tables.days}
       SET completed = FALSE,
           completed_at = NULL,
           photo_data = NULL,
           photo_name = NULL,
           photo_added_at = NULL`
    );

    // Reset events to defaults
    await pool.query(`DELETE FROM ${config.tables.events}`);
    for (const e of DEFAULT_EVENTS) {
      await pool.query(
        `INSERT INTO ${config.tables.events} (day_of_week, time_label, title, color, sort_order) VALUES ($1,$2,$3,$4,$5)`,
        [e.day_of_week, e.time_label, e.title, e.color, e.sort_order]
      );
    }

    res.status(200).json({
      ok: true,
      start_date: startDate,
      total_days: config.totalDays,
      title: config.title,
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: err.message });
  }
};
