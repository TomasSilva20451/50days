const { getPool } = require('./_db');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM days ORDER BY day_number');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { day_number } = req.body;
      if (!day_number) return res.status(400).json({ error: 'day_number required' });

      const { rows: current } = await pool.query(
        'SELECT completed FROM days WHERE day_number = $1',
        [day_number]
      );
      if (!current.length) return res.status(404).json({ error: 'Day not found' });

      const nowCompleted = !current[0].completed;
      const { rows } = await pool.query(
        'UPDATE days SET completed = $1, completed_at = $2 WHERE day_number = $3 RETURNING *',
        [nowCompleted, nowCompleted ? new Date() : null, day_number]
      );
      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Days error:', err);
    res.status(500).json({ error: err.message });
  }
};
