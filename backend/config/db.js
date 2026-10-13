const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/maxhousekeeping';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (err) {
    isConnected = false;
    console.error(`[MongoDB Connection Warning] Could not connect to MongoDB at ${uri}: ${err.message}`);
    console.warn(`[MongoDB Warning] Backend is running in resilient mock/in-memory mode for development until MongoDB is started or configured.`);
  }
};

const getDBStatus = () => ({
  connected: mongoose.connection.readyState === 1 || isConnected,
  readyState: mongoose.connection.readyState,
});

module.exports = { connectDB, getDBStatus };
