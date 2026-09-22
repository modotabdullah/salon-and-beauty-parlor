// js/stylists.js
// Fetches /api/staff and renders a card per stylist.

const container = document.getElementById('stylists-container');

async function loadStylists() {
  try {
    const response = await fetch('/api/staff');
    if (!response.ok) throw new Error('Request failed');
    const stylists = await response.json();

    if (stylists.length === 0) {
      container.innerHTML = '<p>No stylists listed yet.</p>';
      return;
    }

    container.innerHTML = '';

    stylists.forEach((stylist) => {
      const card = document.createElement('div');
      card.className = 'stylist-card';
      card.innerHTML = `
        <div class="stylist-photo">Photo</div>
        <h3>${stylist.first_name} ${stylist.last_name}</h3>
        <p class="stylist-title">${stylist.job_title || ''}</p>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<p>Could not load stylists right now. Please try again later.</p>';
    console.error('Error loading stylists:', err);
  }
}

loadStylists();