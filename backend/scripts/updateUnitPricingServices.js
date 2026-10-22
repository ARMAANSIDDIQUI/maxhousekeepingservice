import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Service from '../src/models/Service.js';
import City from '../src/models/City.js';

async function updateServices() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in env.');
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const activeCities = await City.find({ status: 'active' });
    console.log(`Found ${activeCities.length} active cities.`);

    // 1. Update Swimming Pool Cleaning:
    // ₹0.05 per litre in Moradabad, ₹0.10 per litre in other cities
    const poolCityRates = activeCities.map(c => {
      const slug = (c.slug || c.name.toLowerCase()).trim();
      return {
        cityId: c._id,
        cityName: c.name,
        citySlug: slug,
        rate: slug === 'moradabad' ? 0.05 : 0.10
      };
    });

    const poolRes = await Service.updateOne(
      { slug: 'swimming-pool-cleaning' },
      {
        $set: {
          pricingType: 'unit',
          pricingUnit: 'litre',
          unitLabel: 'Litres',
          minUnitQuantity: 1000,
          unitRateMoradabad: 0.05,
          unitRateOther: 0.10,
          price: 0.05,
          mrp: 0.08,
          hasCitySpecificRates: true,
          cityRates: poolCityRates,
          shortDescription: 'Professional swimming pool cleaning: ₹0.05/L in Moradabad, ₹0.10/L in other cities.',
          description: 'Professional swimming pool cleaning and water clarity management. Pricing: Rs. 0.05 per litre Moradabad only, other city Rs. 0.10 per litre. Algae brushing, submersible vacuuming, sand filter backwash, and chlorine shock balancing.',
          variants: [],
          optionGroups: [],
          matrix: []
        }
      }
    );
    console.log('Swimming pool cleaning updated:', poolRes.modifiedCount);

    // 2. Update Carpet Cleaning:
    // ₹30 per sq ft
    const carpetRes = await Service.updateMany(
      { $or: [{ slug: 'carpet-cleaning' }, { title: /carpet/i }] },
      {
        $set: {
          pricingType: 'unit',
          pricingUnit: 'sq_ft',
          unitLabel: 'Sq. Ft.',
          minUnitQuantity: 50,
          unitRateMoradabad: 30,
          unitRateOther: 30,
          price: 30,
          mrp: 40,
          hasCitySpecificRates: false,
          shortDescription: 'Professional carpet deep cleaning at ₹30 per square foot.',
          description: 'Carpet cleaning services: Rs. 30 per square feet. High-temperature hot water extraction and specialized foam shampooing removes dirt, dust mites, spill stains, and odors from woollen, Persian, and synthetic rugs.',
          variants: [],
          optionGroups: [],
          matrix: []
        }
      }
    );
    console.log('Carpet cleaning services updated:', carpetRes.modifiedCount);

    // 3. Ensure Floor Cleaning is ₹10 / sq ft Moradabad, ₹15 / sq ft others
    const floorRes = await Service.updateMany(
      { $or: [{ slug: 'floor-cleaning' }, { title: /floor cleaning/i }] },
      {
        $set: {
          pricingType: 'unit',
          pricingUnit: 'sq_ft',
          unitLabel: 'Sq. Ft.',
          minUnitQuantity: 100,
          unitRateMoradabad: 10,
          unitRateOther: 15,
          price: 10,
          mrp: 15,
          hasCitySpecificRates: true,
          variants: [],
          optionGroups: [],
          matrix: []
        }
      }
    );
    console.log('Floor cleaning services updated:', floorRes.modifiedCount);

    await mongoose.disconnect();
    console.log('Finished updating services successfully.');
  } catch (err) {
    console.error('Error updating services:', err);
  }
}

updateServices();
