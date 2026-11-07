import { z } from 'zod';
import { SERVICE_SLUGS, STATUSES } from '../../../shared/services.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

export const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100, 'Name is too long'),
  email,
  company: z.string().trim().max(120, 'Company name is too long').optional().default(''),
  industry: z.string().trim().max(80, 'Industry is too long').optional().default(''),
  service: z
    .enum(SERVICE_SLUGS, { errorMap: () => ({ message: 'Choose a service from the list' }) })
    .optional()
    .default('general'),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a little more (at least 10 characters)')
    .max(2000, 'Keep the message under 2000 characters'),
  sourcePage: z.string().trim().max(200).optional().default(''),
  // Honeypot: hidden from people, but bots fill every field.
  website: z.string().optional().default(''),
});

export const subscriberSchema = z.object({
  email,
  sourcePage: z.string().trim().max(200).optional().default(''),
  website: z.string().optional().default(''),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password').max(200),
});

export const inquiryUpdateSchema = z
  .object({
    status: z.enum(STATUSES, { errorMap: () => ({ message: 'Choose a valid status' }) }).optional(),
    notes: z.string().trim().max(1000, 'Keep notes under 1000 characters').optional(),
  })
  .refine((data) => data.status !== undefined || data.notes !== undefined, {
    message: 'Nothing to update',
  });
