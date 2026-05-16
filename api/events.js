const { getPool } = require('./_db');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT * FROM events ORDER BY day_of_week, sort_order, id'
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { day_of_week, time_label, title, color } = req.body;
      if (day_of_week == null || !time_label || !title) {
        return res.status(400).json({ error: 'day_of_week, time_label, title required' });
      }
      const { rows } = await pool.query(
        'INSERT INTO events (day_of_week, time_label, title, color) VALUES ($1,$2,$3,$4) RETURNING *',
        [day_of_week, time_label, title, color || '#c8f135']
      );
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, day_of_week, time_label, title, color } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'id required' });
      }
      const { rows } = await pool.query(
        `UPDATE events
         SET day_of_week = COALESCE($1, day_of_week),
             time_label  = COALESCE($2, time_label),
             title       = COALESCE($3, title),
             color       = COALESCE($4, color)
         WHERE id = $5
         RETURNING *`,
        [day_of_week, time_label, title, color, id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      await pool.query('DELETE FROM events WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Events error:', err);
    res.status(500).json({ error: err.message });
  }
};
