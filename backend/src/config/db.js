const mongoose = require('mongoose');

const env = require('./env');

async function connectDB() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env');
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.MONGODB_URI);
}

module.exports = connectDB;
