import { env } from './config/env.js';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from './config/db.js';
import inquiryRoutes from './routes/inquiries.js';
import subscriberRoutes from './routes/subscribers.js';
import adminRoutes from './routes/admin.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Render/Railway sit behind a proxy; this makes req.ip the real visitor IP,
// which the rate limiter depends on.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'style-src': ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        // Only force HTTPS in production, so `npm start` works on http://localhost.
        'upgrade-insecure-requests': env.isProd ? [] : null,
      },
    },
  })
);
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

// ---------- API ----------
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// ---------- React app (production build) ----------
// One deploy serves both the API and the website, so there are no CORS
// issues and the admin cookie works on the same domain.
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// ---------- Errors ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Try again in a minute.' });
});

connectDB()
  .then(() => app.listen(env.port, () => console.log(`Server running on http://localhost:${env.port}`)))
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
