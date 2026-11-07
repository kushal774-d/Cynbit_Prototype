import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { Inquiry } from '../models/Inquiry.js';
import { Subscriber } from '../models/Subscriber.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimits.js';
import { AUTH_COOKIE, cookieOptions, requireAdmin, signAdminToken } from '../middleware/auth.js';
import { inquiryUpdateSchema, loginSchema } from '../utils/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toCsv } from '../utils/csv.js';
import { SERVICE_SLUGS, STATUSES, serviceName } from '../../../shared/services.js';

const router = Router();

// Compared against when the email doesn't exist, so a wrong email takes as
// long as a wrong password and attackers can't tell which emails are admins.
const DUMMY_HASH = bcrypt.hashSync('placeholder-password-never-used', 12);

// ---------- Auth ----------

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

    if (!admin || !ok) return res.status(401).json({ error: 'Email or password is incorrect.' });

    res.cookie(AUTH_COOKIE, signAdminToken(admin), cookieOptions);
    res.json({ email: admin.email });
  })
);

router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

// Everything below needs a signed-in admin.
router.use(requireAdmin);

router.get('/me', (req, res) => res.json({ email: req.admin.email }));

// ---------- Dashboard data ----------

// Turns query params into a safe MongoDB filter. Only known values are
// accepted, so odd input like ?status[$ne]=x is ignored rather than trusted.
function buildFilter(query) {
  const filter = {};
  if (typeof query.status === 'string' && STATUSES.includes(query.status)) filter.status = query.status;
  if (typeof query.service === 'string' && SERVICE_SLUGS.includes(query.service)) filter.service = query.service;
  if (typeof query.q === 'string' && query.q.trim()) {
    const escaped = query.q.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { company: pattern }, { message: pattern }];
  }
  // sanitizeFilter (see config/db.js) blocks "$" operators by default.
  // This filter was built only from whitelisted values, so mark it trusted.
  return mongoose.trusted(filter);
}

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [byStatus, byService, total, lastWeek, subscribers] = await Promise.all([
      Inquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Inquiry.aggregate([{ $group: { _id: '$service', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ createdAt: mongoose.trusted({ $gte: weekAgo }) }),
      Subscriber.countDocuments(),
    ]);

    const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    byStatus.forEach((row) => (statusCounts[row._id] = row.count));

    res.json({
      total,
      lastWeek,
      subscribers,
      byStatus: statusCounts,
      byService: byService.map((row) => ({ service: row._id, name: serviceName(row._id), count: row.count })),
    });
  })
);

router.get(
  '/inquiries',
  asyncHandler(async (req, res) => {
    const filter = buildFilter(req.query);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const [items, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

router.get(
  '/inquiries/export.csv',
  asyncHandler(async (req, res) => {
    const rows = await Inquiry.find(buildFilter(req.query)).sort({ createdAt: -1 }).limit(5000).lean();
    const csv = toCsv(
      [
        { label: 'Received', value: (r) => r.createdAt.toISOString() },
        { label: 'Name', value: (r) => r.name },
        { label: 'Email', value: (r) => r.email },
        { label: 'Company', value: (r) => r.company },
        { label: 'Industry', value: (r) => r.industry },
        { label: 'Service', value: (r) => serviceName(r.service) },
        { label: 'Status', value: (r) => r.status },
        { label: 'Message', value: (r) => r.message },
        { label: 'Internal notes', value: (r) => r.notes },
      ],
      rows
    );
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cynbit-inquiries-${date}.csv"`);
    res.send('\uFEFF' + csv); // BOM so Excel reads Hindi names and ₹ correctly
  })
);

router.patch(
  '/inquiries/:id',
  validate(inquiryUpdateSchema),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Inquiry not found.' });

    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
    res.json(inquiry);
  })
);

router.get(
  '/subscribers',
  asyncHandler(async (req, res) => {
    const items = await Subscriber.find().sort({ createdAt: -1 }).limit(500).lean();
    res.json({ items, total: await Subscriber.countDocuments() });
  })
);

export default router;
