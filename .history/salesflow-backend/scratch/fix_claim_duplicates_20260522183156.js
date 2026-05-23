/**
 * Fix duplicate claimNumbers and initialize the atomic counter
 * Run this ONCE to clean up existing duplicates
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Claim = require('../src/models/claim.model');

async function fixClaimDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const countersCollection = db.collection('counters');

    // 1. Find all duplicate claimNumbers
    console.log('\n📋 Finding duplicates...');
    const duplicates = await Claim.aggregate([
      { $group: { _id: '$claimNumber', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate claimNumbers`);
      
      for (const dup of duplicates) {
        console.log(`  - claimNumber: ${dup._id}, count: ${dup.count}`);
        // Keep the first (most recently created), delete the rest
        const idsToDelete = dup.ids.slice(1);
        await Claim.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`    Deleted ${idsToDelete.length} duplicate records`);
      }
    } else {
      console.log('✅ No duplicates found');
    }

    // 2. Find the highest claimNumber and initialize counter
    console.log('\n🔢 Initializing atomic counter...');
    const highestClaim = await Claim.findOne(
      { claimNumber: { $exists: true, $ne: null } },
      { claimNumber: 1 }
    ).sort({ claimNumber: -1 }).lean();

    let maxNum = 0;
    if (highestClaim && highestClaim.claimNumber) {
      const numPart = highestClaim.claimNumber.replace('CLM-', '');
      maxNum = parseInt(numPart) || 0;
    }

    // Initialize or update the counter
    await countersCollection.updateOne(
      { _id: 'CLM_claimNumber' },
      { $set: { sequence_value: maxNum } },
      { upsert: true }
    );

    console.log(`✅ Counter initialized at: CLM-${String(maxNum + 1).padStart(4, '0')}`);

    // 3. Verify all claims have unique claimNumbers
    console.log('\n✔️ Verifying uniqueness...');
    const allClaims = await Claim.find({ claimNumber: { $exists: true } }).lean();
    const claimNumbers = allClaims.map(c => c.claimNumber);
    const uniqueNumbers = new Set(claimNumbers);

    if (claimNumbers.length === uniqueNumbers.size) {
      console.log(`✅ All ${claimNumbers.length} claimNumbers are unique`);
    } else {
      console.log(`❌ Still have duplicates: ${claimNumbers.length} claims, ${uniqueNumbers.size} unique`);
    }

    console.log('\n✅ Fix complete!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixClaimDuplicates();
