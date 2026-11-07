import { Router } from 'express';
import { Inquiry } from '../models/Inquiry.js';
import { validate } from '../middleware/validate.js';
import { inquiryLimiter } from '../middleware/rateLimits.js';
import { inquirySchema } from '../utils/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// POST /api/inquiries  (public: the contact form)
router.post(
  '/',
  inquiryLimiter,
  validate(inquirySchema),
  asyncHandler(async (req, res) => {
    const { website, ...data } = req.body;

    // Honeypot filled in: almost certainly a bot. Pretend it worked, save nothing.
    if (website) return res.status(201).json({ ok: true, reference: 'received' });

    const inquiry = await Inquiry.create(data);
    res.status(201).json({ ok: true, reference: inquiry._id.toString().slice(-6).toUpperCase() });
  })
);

export default router;
