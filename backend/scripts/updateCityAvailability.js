import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import mongoose from 'mongoose';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const allCityDocs = await mongoose.connection.collection('cities').find().toArray();
  const allCitySlugs = allCityDocs.map(c => c.slug);
  console.log('All city slugs in DB:', allCitySlugs);

  // Identify Sofa, Carpet, and Chair services
  // User: "all services are avaliable in mbd! but only chair service and carpet service sofa servies are available in other cities!!"
  const multiCitySlugs = [
    'sofa-dry-cleaning',
    'carpet-cleaning',
    'chair-dry-cleaning'
  ];

  const services = await mongoose.connection.collection('services').find().toArray();

  for (const s of services) {
    const isMultiCity = multiCitySlugs.includes(s.slug) ||
      (s.slug && (s.slug.includes('sofa') || s.slug.includes('carpet') || s.slug.includes('chair')));

    const targetCities = isMultiCity ? allCitySlugs : ['moradabad'];

    await mongoose.connection.collection('services').updateOne(
      { _id: s._id },
      {
        $set: {
          cityAvailability: targetCities,
          moradabadOnly: !isMultiCity
        }
      }
    );
    console.log(`Updated "${s.title}" (${s.slug}) -> cities: [${targetCities.join(', ')}]`);
  }

  console.log('Finished updating city availability for all services.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
