// routes/staff.js
// GET /api/staff -> list active staff members (for the Stylists page and booking dropdown).

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT staff_id, first_name, last_name, job_title
      FROM staff
      WHERE is_active = TRUE
      ORDER BY first_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching staff:', err.message);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

module.exports = router;