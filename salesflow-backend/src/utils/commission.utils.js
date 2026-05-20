const { TAX } = require('./constants');

/**
 * Performs full commission chain calculation.
 * Guarantees that the invoiceAmount matches the sum of its rounded line items perfectly
 * to prevent any ledger reconciliation imbalances.
 */
function calculateCommission({ unitValue, contractCommissionPercentage, developerCollectionPercentage, vatPercentage = TAX.VAT_PERCENTAGE, withholdingTaxPercentage = TAX.WITHHOLDING_PERCENTAGE }) {
  // Step 1: Collected commission percentage (النسبة المحصلة الأولى)
  const collectedCommissionPercentage = contractCommissionPercentage * (developerCollectionPercentage / 100);

  // Step 2: Gross commission (includes VAT)
  const grossCommissionWithVAT = (collectedCommissionPercentage / 100) * unitValue;

  // Step 3: Net revenue (extract VAT)
  const netRevenue = grossCommissionWithVAT / (1 + (vatPercentage / 100));

  // Step 4: VAT amount
  const vat = netRevenue * (vatPercentage / 100);

  // Step 5: Withholding tax
  const withholdingTax = netRevenue * (withholdingTaxPercentage / 100);

  // Precise Accounting Rounding of individual components
  const roundedCollectedPercentage = round2(collectedCommissionPercentage);
  const roundedGross = round2(grossCommissionWithVAT);
  const roundedNet = round2(netRevenue);
  const roundedVat = round2(vat);
  const roundedTax = round2(withholdingTax);

  // Step 6: Invoice amount (Calculated from rounded components to guarantee perfect balancing)
  const invoiceAmount = round2(roundedNet + roundedVat - roundedTax);

  return {
    collectedCommissionPercentage: roundedCollectedPercentage,
    grossCommissionWithVAT:        roundedGross,
    netRevenue:                    roundedNet,
    vat:                           roundedVat,
    withholdingTax:                roundedTax,
    invoiceAmount:                 invoiceAmount
  };
}

/**
 * Calculates individual commission for each seller based on their share.
 * Implements the Largest Remainder Method (Penny Allocation Adjustment)
 * to guarantee that the sum of all individual rounded commissions is EXACTLY EQUAL
 * to the grossCommissionWithVAT, preventing any piasters/pennies ledger mismatches.
 */
function calculateSellerCommissions(sellers, grossCommissionWithVAT) {
  if (!sellers || sellers.length === 0) return [];

  // 1. Calculate raw and standard-rounded commission values
  const results = sellers.map(seller => {
    const rawVal = (seller.sharePercentage / 100) * grossCommissionWithVAT;
    return {
      ...seller,
      commissionValue: round2(rawVal)
    };
  });

  // 2. Sum up the rounded individual values
  const sumOfCommissions = results.reduce((acc, s) => acc + s.commissionValue, 0);

  // 3. Calculate discrepancy compared to the exact total
  const discrepancy = round2(grossCommissionWithVAT - sumOfCommissions);

  // 4. If there's any discrepancy, allocate it to the seller with the highest share percentage
  if (discrepancy !== 0) {
    let maxIdx = 0;
    let maxShare = -1;
    for (let i = 0; i < results.length; i++) {
      if (results[i].sharePercentage > maxShare) {
        maxShare = results[i].sharePercentage;
        maxIdx = i;
      }
    }
    // Adjust the largest share seller's commission by the discrepancy
    results[maxIdx].commissionValue = round2(results[maxIdx].commissionValue + discrepancy);
  }

  return results;
}

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

module.exports = { calculateCommission, calculateSellerCommissions };
