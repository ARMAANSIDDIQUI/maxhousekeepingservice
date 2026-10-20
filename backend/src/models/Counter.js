import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'booking_2026'
  seq: { type: Number, default: 1000 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
export default Counter;
