require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Match = require('../models/Match');

async function updatePrices() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Updating unpublished match prices from 49 to 300...');

  const result = await Match.updateMany(
    { 'insightData.isPublished': false, 'insightData.price': 49 },
    { $set: { 'insightData.price': 300 } }
  );

  console.log(`✅ Updated ${result.modifiedCount} matches to price ₹300!`);

  // Also check if any matches have no price set at all
  const resultUnset = await Match.updateMany(
    { 'insightData.isPublished': false, 'insightData.price': { $exists: false } },
    { $set: { 'insightData.price': 300 } }
  );
  console.log(`✅ Set default ₹300 on ${resultUnset.modifiedCount} matches with unset price.`);

  const remaining49 = await Match.countDocuments({ 'insightData.price': 49 });
  const total300 = await Match.countDocuments({ 'insightData.price': 300 });
  console.log(`\n📊 Status: Matches with ₹300: ${total300}, Matches with ₹49: ${remaining49}`);

  await mongoose.disconnect();
}

updatePrices().catch(console.error);
