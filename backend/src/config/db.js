import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/maxhousekeeping';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri}: ${err.message}`);
    console.warn(`[MongoDB Warning] Running with offline resilient mode. Set MONGODB_URI in .env to connect to your database.`);
    return null;
  }
};

export const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1 || isConnected,
  readyState: mongoose.connection.readyState,
});

export default connectDB;
