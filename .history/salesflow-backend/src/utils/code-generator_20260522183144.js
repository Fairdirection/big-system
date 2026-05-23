/**
 * Generates an auto-incrementing code for a model using atomic MongoDB counter.
 * Prevents race conditions when creating codes concurrently.
 * @param {import('mongoose').Model} model 
 * @param {string} field 
 * @param {string} prefix 
 * @param {number} padLength 
 */
async function generateCode(model, field, prefix, padLength = 4) {
  const mongoose = require('mongoose');
  const db = mongoose.connection;
  
  // Use a dedicated counters collection for atomic increments
  const countersCollection = db.collection('counters');
  
  const counterId = `${prefix}_${field}`;
  
  // Atomically increment and return the new counter value
  const result = await countersCollection.findOneAndUpdate(
    { _id: counterId },
    { $inc: { sequence_value: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  
  const nextNum = result.value?.sequence_value || 1;
  
  return `${prefix}-${String(nextNum).padStart(padLength, '0')}`;
}

module.exports = { generateCode };
