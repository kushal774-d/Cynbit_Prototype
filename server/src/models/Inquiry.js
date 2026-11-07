import mongoose from 'mongoose';
import { SERVICE_SLUGS, STATUSES } from '../../../shared/services.js';

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    company: { type: String, trim: true, maxlength: 120, default: '' },
    industry: { type: String, trim: true, maxlength: 80, default: '' },
    service: { type: String, enum: SERVICE_SLUGS, default: 'general' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: STATUSES, default: 'new' },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    sourcePage: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

// Speeds up the admin dashboard's most common queries.
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ service: 1, createdAt: -1 });

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
