import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    sourcePage: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);
