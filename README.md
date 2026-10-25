# VehicleCare

**Smart Web-Based Vehicle Breakdown Assistance and Service Management System**

A full-stack web application that helps vehicle owners report breakdowns, book maintenance services and follow every request until it is resolved. Service providers and administrators have their own dashboards. This is a B.Tech Computer Science and Engineering minor project.

- **Live website:** https://vehiclecare-omega.vercel.app
- **API:** https://vehiclecare-dt1b.onrender.com (health check: `/api/health`)

> The backend runs on a free hosting plan and goes to sleep when unused. The first request after a pause can take up to a minute.

## Features

**Customer**
- Register, log in, edit profile, change password
- Add, edit and remove vehicles
- Report a breakdown (with an optional "use my location" button) or book a maintenance service from a price list
- Track each request on a status timeline and cancel it before the provider is on the way
- Rate a finished service (1 to 5 stars) and print a receipt

**Service provider**
- Switch between Available and Not available
- Receive requests automatically, then accept or reject them
- Take open requests that nobody has accepted yet
- Update progress, add notes and costs, see a personal rating

**Administrator**
- View every request, user and vehicle, with live counts by status
- Manage the maintenance service price list
- Disable or enable accounts and reset a user's password
- Read messages sent from the Contact page

**Everyone**
- In-app notifications (the bell checks for updates every 20 seconds)
- Forgot-password page (email reset link needs an email service to be configured)

## How a request moves

```
Reported -> Assigned -> Accepted -> En Route -> In Progress -> Resolved
        \-> Cancelled (customer only, until the provider is on the way)
```

1. A customer sends a request.
2. The system assigns it to the available provider with the fewest active jobs.
3. If that provider rejects it, the next available provider is tried.
4. If nobody is available, the request becomes an **open request** and the first provider to accept it takes the job.

The server checks every status change against a role table, so nobody can skip a step or act outside their role.

## Technology

| Part | Tools |
|---|---|
| Website | React, Vite, Tailwind CSS, React Router, Axios, Lucide icons |
| Server | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Security | bcrypt password hashing, JWT login tokens, role-based access control, input validation, rate limiting, Helmet, restricted CORS |
| Hosting | Vercel (website), Render (server), GitHub |

## Folder structure

```
vehiclecare/
├── client/            React website
│   └── src/           components, layouts, pages, routes, context, services, utils
└── server/            Express API
    └── src/           config, models, controllers, routes, middleware, utils, seed.js
```

## Run it on your computer

You need Node.js 18 or newer and a free MongoDB Atlas database.

**1. Server**

```bash
cd server
npm install
```

Create a file named `server/.env` (never commit it) with these settings:

```
MONGO_URI=your MongoDB Atlas connection string
JWT_SECRET=a long random text
CLIENT_URL=http://localhost:5173
SEED_PASSWORD=a password for the demo accounts (8+ characters, letters and numbers)
```

Create the demo accounts and the service list, then start the server:

```bash
node src/seed.js
node src/server.js
```

**2. Website** (in a second terminal)

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. The website talks to `http://localhost:5000/api` unless `VITE_API_URL` is set.

## Demo accounts

Created by `node src/seed.js`. The password is the `SEED_PASSWORD` you chose.

| Role | Email |
|---|---|
| Customer | customer@vehiclecare.com |
| Provider | provider@vehiclecare.com |
| Admin | admin@vehiclecare.com |

Public registration only creates customers and providers. Admin accounts exist only through the seed script.

## Settings used in production

| Where | Setting |
|---|---|
| Render (server) | `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the website address), optional `BREVO_API_KEY` and `MAIL_FROM` for reset emails |
| Vercel (website) | `VITE_API_URL` (the server address ending in `/api`) |

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/profile`, `PATCH /api/auth/password`, `PATCH /api/auth/availability`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password/:token` |
| Vehicles (customer) | `GET/POST /api/vehicles`, `PUT/DELETE /api/vehicles/:id` |
| Requests | `POST /api/requests`, `GET /api/requests` (add `?scope=open` for providers), `GET /api/requests/:id`, `PATCH /api/requests/:id/status`, `PATCH /api/requests/:id/claim`, `POST /api/requests/:id/review` |
| Services | `GET /api/services` (public price list) |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` |
| Reviews | `GET /api/reviews/summary` (provider) |
| Contact | `POST /api/contact` (public) |
| Admin | `GET /api/admin/stats`, `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `PATCH /api/admin/users/:id/reset-password`, `GET /api/admin/vehicles`, `GET/POST/PATCH /api/admin/services`, `GET /api/admin/messages` |

## Security notes

- Passwords are hashed and never returned by the API.
- Every private route checks the login token, then the user's role, then ownership of the record.
- Customers cannot read other customers' records. A request that is not yours returns "not found".
- Admins cannot be created through public registration.
- The browser stores the login token in `localStorage`. This is simple but exposes the token to any script injected into the page. A production system could use secure cookies instead.

## Known limitations and future work

- No map display or nearest-provider search yet (the location is stored but not drawn on a map)
- Notifications use polling, not live WebSocket updates
- No automated test suite yet, only manual testing
- No payment gateway, SMS or push notifications
- Password reset by email needs a configured email service
- The free hosting plan sleeps when idle, so the first request can be slow
- Planned: charts for the admin, provider service areas, downloadable reports

## License

Academic project. All rights reserved by the authors.
