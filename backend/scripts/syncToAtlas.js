import mongoose from 'mongoose';

const SOURCE_URI = 'mongodb://localhost:27017/maxhousekeeping';
const DEST_URI = 'mongodb+srv://armaansiddiquimit_db_user:Armaan_123@cluster0.bddkncp.mongodb.net/maxhousekeeping?retryWrites=true&w=majority';

async function migrateData() {
  console.log('----------------------------------------------------');
  console.log('MAX HOUSEKEEPING - MONGODB DATA MIGRATION TO ATLAS');
  console.log('----------------------------------------------------');

  console.log('Connecting to Source (Local MongoDB)...');
  const srcConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  console.log('✓ Connected to Source: ' + SOURCE_URI);

  console.log('Connecting to Destination (Atlas Cluster)...');
  const destConn = await mongoose.createConnection(DEST_URI, {
    serverSelectionTimeoutMS: 15000
  }).asPromise();
  console.log('✓ Connected to Destination Atlas Cluster');

  const srcDb = srcConn.db;
  const destDb = destConn.db;

  const collections = await srcDb.listCollections().toArray();
  const summary = [];

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const srcCol = srcDb.collection(colName);
    const destCol = destDb.collection(colName);

    const srcCount = await srcCol.countDocuments();
    if (srcCount === 0) {
      summary.push({ collection: colName, srcCount: 0, destCount: 0, status: 'EMPTY' });
      continue;
    }

    console.log(`\nMigrating collection "${colName}" (${srcCount} documents)...`);
    const docs = await srcCol.find({}).toArray();

    if (docs.length > 0) {
      // Upsert each document by _id to avoid duplicates and ensure idempotent operation
      const bulkOps = docs.map((doc) => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true
        }
      }));

      const bulkRes = await destCol.bulkWrite(bulkOps, { ordered: false });
      console.log(`  ✓ Upserted: ${bulkRes.upsertedCount}, Modified: ${bulkRes.modifiedCount}, Matched: ${bulkRes.matchedCount}`);
    }

    // Copy indexes
    try {
      const indexes = await srcCol.indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const key = idx.key;
        delete idx.key;
        delete idx.ns;
        delete idx.v;
        await destCol.createIndex(key, idx).catch(() => {});
      }
    } catch (idxErr) {
      console.warn(`  [Notice] Index sync note for ${colName}:`, idxErr.message);
    }

    const destCount = await destCol.countDocuments();
    summary.push({
      collection: colName,
      srcCount,
      destCount,
      status: srcCount === destCount ? 'EXACT MATCH' : 'MISMATCH'
    });
  }

  console.log('\n====================================================');
  console.log('MIGRATION SUMMARY VERIFICATION');
  console.log('====================================================');
  console.table(summary);

  await srcConn.close();
  await destConn.close();
  console.log('\n✓ Connections closed cleanly.');
}

migrateData().catch((err) => {
  console.error('\n✗ Migration failed with error:', err);
  process.exit(1);
});
