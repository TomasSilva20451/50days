const { getPool } = require('./_db');
const { challengeConfig } = require('./_config');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const pool = getPool();
    const config = challengeConfig();

    if (req.method === 'GET') {
      const { rows } = await pool.query(`SELECT * FROM ${config.tables.days} ORDER BY day_number`);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { day_number, photo_data, photo_name } = req.body || {};
      if (!day_number) return res.status(400).json({ error: 'day_number required' });

      const { rows: current } = await pool.query(
        `SELECT completed FROM ${config.tables.days} WHERE day_number = $1`,
        [day_number]
      );
      if (!current.length) return res.status(404).json({ error: 'Day not found' });

      const nowCompleted = !current[0].completed;
      if (nowCompleted && !photo_data) {
        return res.status(400).json({ error: 'photo required to complete day' });
      }
      if (photo_data && !String(photo_data).startsWith('data:image/')) {
        return res.status(400).json({ error: 'photo must be an image data URL' });
      }
      if (photo_data && String(photo_data).length > 1500000) {
        return res.status(400).json({ error: 'photo is too large' });
      }

      const { rows } = await pool.query(
        `UPDATE ${config.tables.days}
         SET completed = $1,
             completed_at = $2,
             photo_data = $3,
             photo_name = $4,
             photo_added_at = $5
         WHERE day_number = $6
         RETURNING *`,
        [
          nowCompleted,
          nowCompleted ? new Date() : null,
          nowCompleted ? photo_data : null,
          nowCompleted ? (photo_name || null) : null,
          nowCompleted ? new Date() : null,
          day_number,
        ]
      );
      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Days error:', err);
    res.status(500).json({ error: err.message });
  }
};
