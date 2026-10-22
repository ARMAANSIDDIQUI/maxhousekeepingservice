import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Service from '../src/models/Service.js';

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Floor Cleaning: pure Per Sq. Ft. unit service
  // Clear old static size options (upto-200, upto-500) so it doesn't show a fake variant dropdown
  const floorRes = await Service.updateOne(
    { title: /Floor Cleaning/i },
    {
      $set: {
        pricingType: 'unit',
        pricingUnit: 'sq_ft',
        unitRateMoradabad: 10,
        unitRateOther: 15,
        unitLabel: 'Square Feet (sq ft)',
        minUnitQuantity: 100,
        price: 10,
        mrp: 15,
        optionGroups: [],
        matrix: []
      }
    }
  );
  console.log('Floor cleaning updated:', floorRes.modifiedCount);

  // 2. Normal services with their real variant matrices
  const normalTitles = [
    'Sofa Drycleaning',
    'Chairs Drycleaning Services',
    'Carpet Cleaning Services',
    'Fans Cleaning Services',
    'Swimming Pool Cleaning',
    'Bed Mattress & Bedhead Dry Cleaning',
    'Kitchen Deep Cleaning',
    'Bathroom Deep Cleaning'
  ];

  for (const t of normalTitles) {
    const res = await Service.updateOne(
      { title: t },
      { $set: { pricingType: 'normal' } }
    );
    console.log(t, 'set to normal:', res.modifiedCount);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

fix().catch(console.error);
