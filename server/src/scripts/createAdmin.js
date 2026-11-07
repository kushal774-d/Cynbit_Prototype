// Creates (or resets the password of) an admin account.
// Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env, then run
//   npm run create-admin
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Use an admin password of at least 10 characters.');
  process.exit(1);
}

await connectDB();
const passwordHash = await bcrypt.hash(password, 12);
await Admin.findOneAndUpdate({ email }, { email, passwordHash }, { upsert: true });
console.log(`Admin ready: ${email}`);
await mongoose.disconnect();
