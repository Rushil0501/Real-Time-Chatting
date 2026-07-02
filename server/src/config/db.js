import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.connection.on('connected', () => {
    console.log('[mongo] connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });

  await mongoose.connect(env.MONGO_URI);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
