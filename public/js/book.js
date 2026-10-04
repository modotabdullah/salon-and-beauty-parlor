// js/book.js
// Populates the service/stylist dropdowns from the API, then handles the
// booking form submit: POST /api/clients -> POST /api/appointments.

const form = document.getElementById('booking-form');
const serviceSelect = document.getElementById('service_id');
const staffSelect = document.getElementById('staff_id');
const statusEl = document.getElementById('form-status');

async function loadServiceOptions() {
  try {
    const response = await fetch('/api/services');
    const services = await response.json();

    serviceSelect.innerHTML = '<option value="">Select a service</option>';
    services.forEach((service) => {
      const option = document.createElement('option');
      option.value = service.service_id;
      option.textContent = `${service.service_name} — ৳${Number(service.base_price).toFixed(2)} (${service.duration_minutes} min)`;
      serviceSelect.appendChild(option);
    });
  } catch (err) {
    serviceSelect.innerHTML = '<option value="">Could not load services</option>';
    console.error('Error loading services for booking form:', err);
  }
}

async function loadStaffOptions() {
  try {
    const response = await fetch('/api/staff');
    const staff = await response.json();

    staffSelect.innerHTML = '<option value="">Select a stylist</option>';
    staff.forEach((member) => {
      const option = document.createElement('option');
      option.value = member.staff_id;
      option.textContent = `${member.first_name} ${member.last_name}${member.job_title ? ' — ' + member.job_title : ''}`;
      staffSelect.appendChild(option);
    });
  } catch (err) {
    staffSelect.innerHTML = '<option value="">Could not load stylists</option>';
    console.error('Error loading staff for booking form:', err);
  }
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `form-status ${type}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Booking your appointment…', '');

  const formData = new FormData(form);
  const first_name = formData.get('first_name').trim();
  const last_name = formData.get('last_name').trim();
  const email = formData.get('email').trim();
  const phone = formData.get('phone').trim();
  const service_id = formData.get('service_id');
  const staff_id = formData.get('staff_id');
  const appointment_date = formData.get('appointment_date');
  const start_time = formData.get('start_time');

  if (!first_name || !last_name || !email || !service_id || !staff_id || !appointment_date || !start_time) {
    setStatus('Please fill in all required fields.', 'error');
    return;
  }

  try {
    // Step 1: find or create the client.
    const clientResponse = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, email, phone }),
    });

    if (!clientResponse.ok) throw new Error('Could not save client details');
    const clientData = await clientResponse.json();

    // Step 2: create the appointment for that client.
    const appointmentResponse = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientData.client_id,
        service_id,
        staff_id,
        appointment_date,
        start_time,
      }),
    });

    if (!appointmentResponse.ok) throw new Error('Could not create appointment');

    setStatus('Your appointment is booked! We look forward to seeing you.', 'success');
    form.reset();
    await loadServiceOptions();
    await loadStaffOptions();
  } catch (err) {
    setStatus('Something went wrong while booking. Please try again.', 'error');
    console.error('Booking error:', err);
  }
});

loadServiceOptions();
loadStaffOptions();