const { getPool } = require('./_db');

const DEFAULT_EVENTS = [
  // Segunda (0)
  { day_of_week: 0, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  // Terça (1)
  { day_of_week: 1, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  // Quarta (2)
  { day_of_week: 2, time_label: '7h–9h',      title: 'Ténis',   color: '#4fc3f7', sort_order: 0 },
  { day_of_week: 2, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 1 },
  { day_of_week: 2, time_label: '18h',        title: 'Universidade', color: '#ce93d8', sort_order: 2 },
  // Quinta (3)
  { day_of_week: 3, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  { day_of_week: 3, time_label: '20h',        title: 'Jantar com amigos/família', color: '#f48fb1', sort_order: 1 },
  // Sexta (4)
  { day_of_week: 4, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
  // Sábado (5)
  { day_of_week: 5, time_label: '7h–9h',      title: 'Ténis',   color: '#4fc3f7', sort_order: 0 },
  { day_of_week: 5, time_label: '10h+',       title: 'Ginásio', color: '#ff9800', sort_order: 1 },
  // Domingo (6)
  { day_of_week: 6, time_label: '10h ou 17h', title: 'Ginásio', color: '#ff9800', sort_order: 0 },
];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const pool = getPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS days (
        day_number INTEGER PRIMARY KEY,
        completed   BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id          SERIAL PRIMARY KEY,
        day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        time_label  VARCHAR(30) NOT NULL,
        title       VARCHAR(255) NOT NULL,
        color       VARCHAR(20) DEFAULT '#c8f135',
        sort_order  INTEGER DEFAULT 0,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Seed 53 days (idempotent)
    for (let i = 1; i <= 53; i++) {
      await pool.query(
        'INSERT INTO days (day_number) VALUES ($1) ON CONFLICT DO NOTHING',
        [i]
      );
    }

    // Seed default events only if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM events');
    if (parseInt(rows[0].count) === 0) {
      for (const e of DEFAULT_EVENTS) {
        await pool.query(
          'INSERT INTO events (day_of_week, time_label, title, color, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [e.day_of_week, e.time_label, e.title, e.color, e.sort_order]
        );
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Init error:', err);
    res.status(500).json({ error: err.message });
  }
};
