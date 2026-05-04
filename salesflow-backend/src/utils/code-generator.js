/**
 * Generates an auto-incrementing code for a model.
 * @param {import('mongoose').Model} model 
 * @param {string} field 
 * @param {string} prefix 
 * @param {number} padLength 
 */
async function generateCode(model, field, prefix, padLength = 4) {
  // Find the highest existing code
  const last = await model.findOne({}, { [field]: 1 })
    .sort({ [field]: -1 })
    .lean();

  let nextNum = 1;
  if (last && last[field]) {
    const numPart = last[field].replace(prefix + '-', '');
    const num = parseInt(numPart);
    if (!isNaN(num)) {
      nextNum = num + 1;
    }
  }

  return `${prefix}-${String(nextNum).padStart(padLength, '0')}`;
}

module.exports = { generateCode };
