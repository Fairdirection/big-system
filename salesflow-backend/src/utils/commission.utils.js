/**
 * Performs full commission chain calculation.
 */
function calculateCommission({ unitValue, contractCommissionPercentage, developerCollectionPercentage }) {
  // Step 1: Collected commission percentage
  const collectedCommissionPercentage = contractCommissionPercentage * (developerCollectionPercentage / 100);

  // Step 2: Gross commission (includes VAT)
  const grossCommissionWithVAT = (collectedCommissionPercentage / 100) * unitValue;

  // Step 3: Net revenue (extract VAT)
  const netRevenue = grossCommissionWithVAT / 1.14;

  // Step 4: VAT amount
  const vat = netRevenue * 0.14;

  // Step 5: Withholding tax
  const withholdingTax = netRevenue * 0.05;

  // Step 6: Invoice amount
  const invoiceAmount = netRevenue + vat - withholdingTax;

  return {
    collectedCommissionPercentage: round2(collectedCommissionPercentage),
    grossCommissionWithVAT:        round2(grossCommissionWithVAT),
    netRevenue:                    round2(netRevenue),
    vat:                           round2(vat),
    withholdingTax:                round2(withholdingTax),
    invoiceAmount:                 round2(invoiceAmount)
  };
}

/**
 * Calculates individual commission for each seller based on their share.
 */
function calculateSellerCommissions(sellers, grossCommissionWithVAT) {
  return sellers.map(seller => ({
    ...seller,
    commissionValue: round2((seller.sharePercentage / 100) * grossCommissionWithVAT)
  }));
}

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

module.exports = { calculateCommission, calculateSellerCommissions };
