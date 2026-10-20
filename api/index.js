import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../backend/src/app.js';
import connectDB from '../backend/src/config/db.js';

export default async function handler(req, res) {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[Vercel Serverless] DB connection error:', err.message);
    }
  }
  return app(req, res);
}

