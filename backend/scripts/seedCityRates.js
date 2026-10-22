import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Service from '../src/models/Service.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await Service.updateOne(
    { title: /Floor Cleaning/i },
    {
      $set: {
        pricingType: 'unit',
        pricingUnit: 'sq_ft',
        unitLabel: 'Sq. Ft.',
        minUnitQuantity: 100,
        price: 10,
        mrp: 15,
        unitRateMoradabad: 10,
        unitRateOther: 15,
        hasCitySpecificRates: true,
        cityRates: [
          { citySlug: 'moradabad', cityName: 'Moradabad', rate: 10 },
          { citySlug: 'rampur', cityName: 'Rampur', rate: 15 },
          { citySlug: 'sambhal', cityName: 'Sambhal', rate: 14 },
          { citySlug: 'amroha', cityName: 'Amroha', rate: 12 },
          { citySlug: 'chandausi', cityName: 'Chandausi', rate: 14 },
          { citySlug: 'kashipur', cityName: 'Kashipur', rate: 15 },
          { citySlug: 'bijnor', cityName: 'Bijnor', rate: 15 },
          { citySlug: 'dhampur', cityName: 'Dhampur', rate: 15 },
          { citySlug: 'gajraula', cityName: 'Gajraula', rate: 13 }
        ]
      }
    }
  );
  console.log('Floor cleaning cityRates populated:', res.modifiedCount);
  await mongoose.disconnect();
}
run().catch(console.error);
