import { Router } from 'express';
import { Subscriber } from '../models/Subscriber.js';
import { validate } from '../middleware/validate.js';
import { subscribeLimiter } from '../middleware/rateLimits.js';
import { subscriberSchema } from '../utils/schemas.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// POST /api/subscribers  (public: the newsletter box in the footer)
router.post(
  '/',
  subscribeLimiter,
  validate(subscriberSchema),
  asyncHandler(async (req, res) => {
    const { website, email, sourcePage } = req.body;
    if (website) return res.status(201).json({ ok: true, message: 'You’re subscribed.' });

    try {
      await Subscriber.create({ email, sourcePage });
      return res.status(201).json({ ok: true, message: 'You’re subscribed.' });
    } catch (err) {
      // 11000 = duplicate key: the unique index on email caught a repeat signup.
      if (err.code === 11000) {
        return res.status(200).json({ ok: true, message: 'You’re already on the list.' });
      }
      throw err;
    }
  })
);

export default router;
