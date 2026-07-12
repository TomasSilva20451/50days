const { getPool } = require('./_db');

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

  const pool = getPool();

  try {
    // Clear all day completions
    await pool.query('UPDATE days SET completed = FALSE, completed_at = NULL');

    // Reset events to defaults
    await pool.query('DELETE FROM events');
    for (const e of DEFAULT_EVENTS) {
      await pool.query(
        'INSERT INTO events (day_of_week, time_label, title, color, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [e.day_of_week, e.time_label, e.title, e.color, e.sort_order]
      );
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: err.message });
  }
};
