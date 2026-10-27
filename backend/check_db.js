import mongoose from 'mongoose';
import User from './src/models/User.js';
import Booking from './src/models/Booking.js';

await mongoose.connect('mongodb://localhost:27017/maxhousekeeping');

const supervisors = await User.find({ role: { $in: ['supervisor', 'admin'] } }).select('name email role _id phone status');
console.log('USERS:', JSON.stringify(supervisors, null, 2));

const bookings = await Booking.find().select('bookingCode customer slot assignedSlot supervisor assignedSupervisor status').sort({ createdAt: -1 }).limit(10);
console.log('BOOKINGS:', JSON.stringify(bookings, null, 2));

await mongoose.disconnect();
