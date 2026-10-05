# Patuakhali Parlor — Salon & Beauty Parlor Website

A full-stack salon and beauty parlor booking website. Static HTML/CSS/JS frontend, Express.js backend, PostgreSQL database.

## Project scope

The full database schema (provided separately) includes modules for staff scheduling, inventory, billing/POS, gift cards, and commissions — 17 tables in total. This project implements only the public-facing booking flow, using six of those tables:

`categories`, `services`, `staff`, `clients`, `appointments`, `appointment_items`

The remaining 11 tables exist in the schema but are intentionally out of scope for this build (see **Future work** below).

## Design decisions

- **One service per appointment.** No multi-service cart — each booking creates exactly one `appointments` row and one `appointment_items` row. This kept the booking form and backend logic proportional to the project's timeline.
- **Client lookup by email.** Booking doesn't require an account — the backend finds an existing client by email or creates a new one, so repeat visitors don't generate duplicate client rows.
- **Double-booking prevention.** The backend checks for a time overlap on the same stylist and date before inserting a new appointment, rejecting the request with a `409` if the slot is already taken. This is an application-level check — the schema itself has no constraint preventing it, so the guarantee only holds as long as all appointment creation goes through this one API route.

## Setup

1. Install dependencies: `npm install`

2. Copy `.env.example` to `.env` and fill in your real PostgreSQL credentials: `cp .env.example .env`

3. Make sure your PostgreSQL database has the six tables above created (run your schema SQL if you haven't already).

4. Start the server: `node server.js` or `npm start`

6. Visit `http://localhost:3000` in your browser.

## Project Structure
```text
.
├── db
│   └── pool.js
├── public
│   ├── book.html
│   ├── contact.html
│   ├── css
│   │   └── style.css
│   ├── images
│   │   ├── hero
│   │   │   └── hero-salon.jpg
│   │   ├── services
│   │   │   ├── color.jpg
│   │   │   ├── cut-styling.jpg
│   │   │   └── skin-treatment.jpg
│   │   └── stylists
│   │       ├── avatar-female.jpg
│   │       └── avatar-male.jpg
│   ├── index.html
│   ├── js
│   │   ├── book.js
│   │   ├── nav.js
│   │   ├── services.js
│   │   └── stylists.js
│   ├── services.html
│   └── stylists.html
├── README.md
├── routes
│   ├── appointments.js
│   ├── clients.js
│   ├── services.js
│   └── staff.js
└── server.js
```

## API endpoints

| Method | Route                    | Purpose                                               |
|--------|--------------------------|-------------------------------------------------------|
| GET    | `/api/services`          | List services, joined with category name              |
| GET    | `/api/staff`             | List active staff members (`is_active = TRUE` only)   |
| POST   | `/api/clients`           | Find an existing client by email, or create a new one |
| POST   | `/api/appointments`      | Book a single-service appointment                     |
| GET    | `/api/appointments`      | List all appointments (used for testing/verification) |

## How booking works

1. On page load, `book.js` fetches `/api/services` and `/api/staff` to populate the Service and Stylist dropdowns with live data — nothing on the booking form is hardcoded.
2. On submit, the frontend makes **two sequential POST requests**:
   - `POST /api/clients` — finds the client by email, or inserts a new row into `clients`. Returns the `client_id` either way.
   - `POST /api/appointments` — using that `client_id`, looks up the chosen service's `duration_minutes`, computes `end_time`, checks for a scheduling conflict for that stylist/date/time, and if clear, inserts one row into `appointments` and one into `appointment_items` inside a single transaction (`BEGIN` / `COMMIT` / `ROLLBACK`), so a failure partway through never leaves an orphaned row.
3. If the chosen stylist already has an overlapping booking at that date/time, the second request returns `409` and the booking is rejected before anything is written.

## Future work (not implemented)

- Staff scheduling & time-off requests
- Inventory / retail product tracking
- Billing, invoices, gift cards, commissions
- Admin authentication / dashboard
- Multi-service appointments (cart-style booking)
- Database-level enforcement of the no-overlap rule (e.g. a PostgreSQL `EXCLUDE` constraint using `btree_gist`), rather than relying solely on the application-level check in `routes/appointments.js`