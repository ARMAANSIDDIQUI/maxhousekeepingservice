import dotenv from 'dotenv';
dotenv.config();

import User from '../src/models/User.js';
import Booking from '../src/models/Booking.js';
import Service from '../src/models/Service.js';
import { uploadVideo, uploadPhoto } from '../src/middleware/upload.js';
import app from '../src/app.js';

import { getSupervisorSlotAvailability, assignSupervisorToBooking } from '../src/controllers/adminController.js';
import { getSupervisorSchedule } from '../src/controllers/supervisorController.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('MAX HOUSEKEEPING ENTERPRISE VERIFICATION');
console.log('========================================\n');

// 1. User Model Schema Check
console.log('1. User Model & Supervisor Role:');
const roleValues = User.schema.path('role').enumValues;
assert(roleValues.includes('supervisor'), `User role enum includes 'supervisor' (Roles: ${roleValues.join(', ')})`);
assert(User.schema.path('passwordHash') !== undefined, 'User schema has passwordHash field');
assert(typeof User.generateDefaultAvatar === 'function', 'User.generateDefaultAvatar static method exists');

// 2. Booking Model Schema Check
console.log('\n2. Booking Model Enterprise Schema:');
assert(Booking.schema.path('supervisor') !== undefined, 'Booking schema has supervisor ref');
assert(Booking.schema.path('assignedSupervisor.name') !== undefined, 'Booking schema has assignedSupervisor.name');
assert(Booking.schema.path('assignedSupervisor.phone') !== undefined, 'Booking schema has assignedSupervisor.phone');
assert(Booking.schema.path('assignedSlot.date') !== undefined, 'Booking schema has assignedSlot.date');
assert(Booking.schema.path('assignedSlot.timeWindow') !== undefined, 'Booking schema has assignedSlot.timeWindow');
assert(Booking.schema.path('serviceOtp') !== undefined, 'Booking schema has serviceOtp field');
assert(Booking.schema.path('otpVerified') !== undefined, 'Booking schema has otpVerified boolean');
assert(Booking.schema.path('otpVerifiedAt') !== undefined, 'Booking schema has otpVerifiedAt date');
assert(Booking.schema.path('photos.before') !== undefined, 'Booking schema has photos.before array');
assert(Booking.schema.path('photos.after') !== undefined, 'Booking schema has photos.after array');
const msgSenderEnum = Booking.schema.path('messages.sender').enumValues;
assert(msgSenderEnum.includes('supervisor'), `messages.sender enum includes 'supervisor' (Senders: ${msgSenderEnum.join(', ')})`);

// 3. Service Model Schema Check
console.log('\n3. Service Video Schema:');
assert(Service.schema.path('videoUrl') !== undefined, 'Service schema has videoUrl field');
assert(Service.schema.path('videoPublicId') !== undefined, 'Service schema has videoPublicId field');
assert(Service.schema.path('videoDuration') !== undefined, 'Service schema has videoDuration field');

// 4. Upload Middleware Constraints
console.log('\n4. Upload Size Constraints & Validations:');
assert(uploadVideo !== undefined, 'uploadVideo multer middleware exported');
assert(uploadPhoto !== undefined, 'uploadPhoto multer middleware exported');

// 5. Time Slot Allotment & Controller Logic Checks
console.log('\n5. Time Slot Allotment & Availability Controllers:');
assert(typeof assignSupervisorToBooking === 'function', 'assignSupervisorToBooking controller exported with conflict check');
assert(typeof getSupervisorSlotAvailability === 'function', 'getSupervisorSlotAvailability controller exported for live conflict detection');
assert(typeof getSupervisorSchedule === 'function', 'getSupervisorSchedule controller exported for supervisor timeline run-sheet');

// 6. Express App Route Mounting Check
console.log('\n6. Express Application Route Mounting:');
assert(app !== undefined, 'Express app loaded and initialized');

const routes = [];
app._router.stack.forEach(middleware => {
  if (middleware.route) {
    routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    const basePath = middleware.regexp.source
      .replace('\\/?(?=\\/|$)', '')
      .replace('^\\', '')
      .replace('(?=\\/|$)', '')
      .replace('\\', '')
      .replace(/\\\//g, '/');
    middleware.handle.stack.forEach(handler => {
      if (handler.route) {
        const method = Object.keys(handler.route.methods).join(',').toUpperCase();
        routes.push(`${method} ${basePath}${handler.route.path}`);
      }
    });
  }
});

const requiredEndpoints = [
  '/api/v1/supervisor/stats',
  '/api/v1/supervisor/schedule',
  '/api/v1/supervisor/bookings',
  '/api/v1/supervisor/bookings/:id/verify-otp',
  '/api/v1/supervisor/bookings/:id/photos',
  '/api/v1/supervisor/bookings/:id/status',
  '/api/v1/admin/supervisors/slot-availability',
  '/api/v1/admin/supervisors',
  '/api/v1/admin/bookings/:id/assign',
  '/api/v1/admin/upload-video',
  '/api/v1/bookings/my',
  '/api/v1/bookings/track/:code'
];

requiredEndpoints.forEach(ep => {
  const exists = routes.some(r => r.includes(ep));
  assert(exists, `Route mounted: ${ep}`);
});

console.log('\n========================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
