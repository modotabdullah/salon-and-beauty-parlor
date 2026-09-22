// routes/services.js
// GET /api/services -> list all services, joined with their category name.

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.service_id,
        s.service_name,
        s.description,
        s.base_price,
        s.duration_minutes,
        c.category_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.category_id
      ORDER BY c.category_name, s.service_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching services:', err.message);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

module.exports = router;