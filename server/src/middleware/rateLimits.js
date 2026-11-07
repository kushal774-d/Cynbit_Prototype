import rateLimit from 'express-rate-limit';

const make = (limit, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
  });

// Public forms: generous enough for real people, tight enough to stop spam bursts.
export const inquiryLimiter = make(5, 15, 'Too many inquiries from this network. Try again in 15 minutes.');
export const subscribeLimiter = make(10, 15, 'Too many signup attempts. Try again in 15 minutes.');
// Login: slows down password guessing.
export const loginLimiter = make(10, 15, 'Too many login attempts. Try again in 15 minutes.');
