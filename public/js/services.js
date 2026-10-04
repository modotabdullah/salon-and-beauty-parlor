// js/services.js
// Fetches /api/services and renders them grouped by category.

const container = document.getElementById('services-container');

function formatPrice(price) {
  return `৳${Number(price).toFixed(2)}`;
}

function groupByCategory(services) {
  const groups = {};
  services.forEach((service) => {
    const category = service.category_name || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(service);
  });
  return groups;
}

async function loadServices() {
  try {
    const response = await fetch('/api/services');
    if (!response.ok) throw new Error('Request failed');
    const services = await response.json();

    if (services.length === 0) {
      container.innerHTML = '<p>No services available yet.</p>';
      return;
    }

    const grouped = groupByCategory(services);
    container.innerHTML = '';

    Object.keys(grouped).forEach((categoryName) => {
      const group = document.createElement('div');
      group.className = 'category-group';

      const heading = document.createElement('h3');
      heading.textContent = categoryName;
      group.appendChild(heading);

      grouped[categoryName].forEach((service) => {
        const row = document.createElement('div');
        row.className = 'service-row';
        row.innerHTML = `
          <div class="service-info">
            <h4>${service.service_name}</h4>
            <p>${service.description || ''}</p>
          </div>
          <div class="service-meta">
            <span class="service-price">${formatPrice(service.base_price)}</span>
            <span>${service.duration_minutes} min</span>
          </div>
        `;
        group.appendChild(row);
      });

      container.appendChild(group);
    });
  } catch (err) {
    container.innerHTML = '<p>Could not load services right now. Please try again later.</p>';
    console.error('Error loading services:', err);
  }
}

loadServices();