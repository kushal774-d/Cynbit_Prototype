# Cynbit lead capture and management

A working prototype that fixes how Cynbit's website turns visitors into leads. Built with React, Node.js (Express) and MongoDB.

## The problem

On cynbit.in:

- The **contact form** collects name, email, company, industry and a message, but the page's own FAQ tells visitors to start by email or phone. There is no confirmation, no reference number and no way for the team to track what happens to an inquiry.
- On the **services page**, the "Inquire" and "Start discovery" buttons under each service don't lead anywhere, so a visitor interested in a specific service hits a dead end.
- The **newsletter** block in the footer has a "Join the Newsletter" button but no email field.

<!-- Replace the bullets above with what YOU confirmed in Chrome DevTools, and add your screenshots. -->

## What this prototype does

**For visitors**
- Every service has an "Ask about this" button that opens the contact form with that service already selected (`/contact?service=ai-voice-agents`).
- The contact form validates each field in the browser and again on the server, shows errors next to the field, and confirms with a reference number.
- The footer newsletter signup saves the email and handles repeat signups gracefully.

**For the Cynbit team** (`/admin`, sign-in required)
- A pipeline bar showing how many leads are New, Contacted, Won and Lost. Click a status to filter.
- A searchable, filterable table of every inquiry. Change status inline, read the full message, and keep internal notes.
- Export the current view to CSV, and see all newsletter subscribers.

## Tech stack and why

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + React Router | Fast dev server, small production build, client-side routing |
| Backend | Node.js + Express | Simple REST API, same language as the frontend |
| Database | MongoDB (Atlas) + Mongoose | Flexible documents for inquiries, schema validation through Mongoose, free hosted tier |
| Validation | zod | One schema gives clear per-field error messages |
| Auth | bcrypt-hashed passwords + JWT in an httpOnly cookie | Token can't be read by page JavaScript; `sameSite=strict` blocks cross-site requests |
| Deploy | Render (single web service) | Express serves both the API and the React build, so no CORS setup and the cookie works on one domain |

The service list lives in `shared/services.js` and is used by both the server (to validate) and the client (to render), so they can never drift apart.

## Architecture

```
Visitor                    Express API                          MongoDB
-------                    -----------                          -------
Services page --"Ask about this"--> /contact?service=slug
Contact form  --POST /api/inquiries--> rate limit -> zod -> honeypot --> inquiries
Footer        --POST /api/subscribers-> rate limit -> zod -> unique index --> subscribers

Team member
-----------
/admin/login  --POST /api/admin/login--> bcrypt check -> httpOnly JWT cookie
/admin        --GET/PATCH /api/admin/*--> requireAdmin --> inquiries, subscribers
```

## Security choices

- **Validation on the server**, not only in the browser, with length limits on every field.
- **Rate limiting**: 5 inquiries, 10 signups and 10 login attempts per IP per 15 minutes.
- **Honeypot field** that people never see; bots fill it and are silently ignored.
- **NoSQL injection**: Mongoose `sanitizeFilter` is on, and admin filters accept only whitelisted values.
- **CSV injection**: exported cells starting with `= + - @` are escaped so Excel won't run them as formulas.
- **Login**: bcrypt hashes, same response time for unknown emails, httpOnly + sameSite cookie, 8-hour expiry.
- **Helmet** security headers and a 20 kB request body limit. Secrets live only in environment variables.

## Run it locally

You need Node.js 18+ and a MongoDB connection string (a free MongoDB Atlas cluster works).

```bash
# 1. Install
npm run install-all

# 2. Configure
cp server/.env.example server/.env    # then fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Create your admin account
npm run create-admin

# 4. Start the API (terminal 1)
cd server && npm run dev               # http://localhost:5000

# 5. Start the website (terminal 2)
cd client && npm run dev               # http://localhost:5173
```

On Windows, use `copy server\.env.example server\.env` in step 2.

## Deploy (Render + MongoDB Atlas)

1. In MongoDB Atlas, create a free cluster, a database user, and under **Network Access** allow `0.0.0.0/0` (Render's free tier has no fixed IP).
2. Push this repo to GitHub.
3. On Render, create a **Web Service** from the repo:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Environment variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`
4. Create the admin user once by running `npm run create-admin` locally with `MONGODB_URI` in `server/.env` pointing at Atlas.

Render's free tier sleeps when idle, so the first request after a while can take up to a minute.

## API reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/inquiries` | public | Submit a contact form inquiry |
| POST | `/api/subscribers` | public | Join the newsletter |
| POST | `/api/admin/login` | public | Sign in, sets cookie |
| POST | `/api/admin/logout` | public | Sign out |
| GET | `/api/admin/me` | admin | Current admin |
| GET | `/api/admin/stats` | admin | Counts by status and service |
| GET | `/api/admin/inquiries?status=&service=&q=&page=` | admin | Filtered, paginated list |
| PATCH | `/api/admin/inquiries/:id` | admin | Update status or notes |
| GET | `/api/admin/inquiries/export.csv` | admin | CSV of the current filter |
| GET | `/api/admin/subscribers` | admin | Newsletter subscribers |

## Limitations and next steps

- Email alerts to the team and a confirmation email to the visitor (Nodemailer or Resend).
- Double opt-in for the newsletter and an unsubscribe link.
- Rate limits are stored in memory, so they reset on restart. A Redis store would fix this for multiple servers.
- A CAPTCHA such as Cloudflare Turnstile if spam gets past the honeypot.
- Multiple admin accounts with roles, and automated API tests.

## Project structure

```
shared/services.js         Service list used by client and server
server/src/index.js        Express app, security middleware, serves the React build
server/src/models/         Inquiry, Subscriber, Admin
server/src/routes/         inquiries, subscribers, admin
server/src/middleware/     validation, rate limits, auth
server/src/utils/          zod schemas, CSV export
server/src/scripts/        createAdmin
client/src/pages/          Services, Contact, AdminLogin, AdminDashboard
client/src/components/     Header, Footer (newsletter)
```
