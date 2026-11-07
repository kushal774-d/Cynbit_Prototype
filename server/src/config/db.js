import mongoose from 'mongoose';
import { env } from './env.js';

// Strips keys starting with "$" from query filters, which blocks
// NoSQL injection like ?status[$ne]=x reaching MongoDB.
mongoose.set('sanitizeFilter', true);

export async function connectDB() {
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
