// routes/clients.js
// POST /api/clients -> find an existing client by email, or create a new one.
// Returns the client_id either way, so the booking flow can attach an appointment to it.

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.post('/', async (req, res) => {
  const { first_name, last_name, phone, email } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'first_name, last_name, and email are required' });
  }

  try {
    // Check if a client with this email already exists.
    const existing = await pool.query(
      'SELECT client_id FROM clients WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.json({ client_id: existing.rows[0].client_id, created: false });
    }

    // Otherwise, insert a new client.
    const result = await pool.query(
      `INSERT INTO clients (first_name, last_name, phone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING client_id`,
      [first_name, last_name, phone || null, email]
    );

    res.status(201).json({ client_id: result.rows[0].client_id, created: true });
  } catch (err) {
    console.error('Error creating client:', err.message);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

module.exports = router;