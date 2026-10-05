// routes/appointments.js
// POST /api/appointments -> book a single-service appointment.
// GET  /api/appointments -> list all appointments (useful for testing / an admin view).
//
// Scope decision: one service per appointment. That means one row in `appointments`
// plus exactly one row in `appointment_items` per booking - no multi-service cart.

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Helper: add N minutes to a "HH:MM" time string, return "HH:MM:SS".
function addMinutes(startTime, minutesToAdd) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
}

router.post('/', async (req, res) => {
  const { client_id, service_id, staff_id, appointment_date, start_time } = req.body;

  if (!client_id || !service_id || !staff_id || !appointment_date || !start_time) {
    return res.status(400).json({
      error: 'client_id, service_id, staff_id, appointment_date, and start_time are all required',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Look up the service's duration so we can compute end_time and total_duration_minutes.
    const serviceResult = await client.query(
      'SELECT duration_minutes FROM services WHERE service_id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Service not found' });
    }

    const durationMinutes = serviceResult.rows[0].duration_minutes;
    const endTime = addMinutes(start_time, durationMinutes);

    // Error if staff is already occupied
    const conflictResult = await client.query(
      `SELECT 1
       FROM appointment_items ai
       JOIN appointments a ON a.appointment_id = ai.appointment_id
       WHERE ai.staff_id = $1
        AND a.appointment_date = $2
        AND a.status != 'Cancelled'
        AND ai.start_time < $3
        AND ai.end_time > $4
       LIMIT 1`,
       [staff_id, appointment_date, endTime, start_time]
    );

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({error: 'This stylist already has a booking that overlaps this time slot'});
    }

    // Insert the parent appointment.
    const appointmentResult = await client.query(
      `INSERT INTO appointments (client_id, appointment_date, status, total_duration_minutes)
       VALUES ($1, $2, 'Booked', $3)
       RETURNING appointment_id`,
      [client_id, appointment_date, durationMinutes]
    );

    const appointmentId = appointmentResult.rows[0].appointment_id;

    // Insert the single appointment item (resource_id left null - not used in this scope).
    await client.query(
      `INSERT INTO appointment_items (appointment_id, service_id, staff_id, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)`,
      [appointmentId, service_id, staff_id, start_time, endTime]
    );

    await client.query('COMMIT');
    res.status(201).json({ appointment_id: appointmentId, status: 'Booked' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating appointment:', err.message);
    res.status(500).json({ error: 'Failed to create appointment' });
  } finally {
    client.release();
  }
});

// Optional: list appointments with joined details - handy for testing the booking flow.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.appointment_id,
        a.appointment_date,
        a.status,
        cl.first_name AS client_first_name,
        cl.last_name AS client_last_name,
        s.service_name,
        st.first_name AS staff_first_name,
        st.last_name AS staff_last_name,
        ai.start_time,
        ai.end_time
      FROM appointments a
      JOIN clients cl ON a.client_id = cl.client_id
      JOIN appointment_items ai ON ai.appointment_id = a.appointment_id
      JOIN services s ON ai.service_id = s.service_id
      JOIN staff st ON ai.staff_id = st.staff_id
      ORDER BY a.appointment_date DESC, ai.start_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err.message);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;