const TAX = {
  VAT_PERCENTAGE: 14,
  WITHHOLDING_PERCENTAGE: 5
};

const COMMISSION = {
  MIN_RATE_PER_MILLION: 4500,       // EGP per million (lowest company tier)
  TL_MIN_RATE_PER_MILLION: 1800,    // EGP per million for TeamLeader (lowest team tier)
  TL_COMPANY_FIXED_RATE: 1500,      // EGP per million for TL company sales (flat, no tier)
  ONE_THIRD_THRESHOLD: 1.9,         // developer rate at or below which the 1/3 rule applies
  PERSONAL_SALE_THRESHOLD: 3.0      // developer rate at or above which sale is classified as personal
};

const PAYOUT_CYCLES = {
  CYCLE_A_MIN_DAY: 5,
  CYCLE_A_MAX_DAY: 15,
  CYCLE_A_PAYOUT_DAY: 20,
  CYCLE_B_PAYOUT_DAY: 10
};

module.exports = { TAX, COMMISSION, PAYOUT_CYCLES };
