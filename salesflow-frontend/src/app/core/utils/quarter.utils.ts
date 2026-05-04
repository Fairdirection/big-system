/**
 * Returns quarter ID string — e.g. "Q2-2026"
 * Mirrors backend src/utils/quarter.utils.js getQuarterId()
 */
export function getQuarterId(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${q}-${date.getFullYear()}`;
}

/**
 * Formats quarter ID for display — e.g. "Q2-2026" -> "الربع 2 - 2026"
 */
export function formatQuarter(quarterId: string): string {
  if (!quarterId) return '';
  const [q, year] = quarterId.split('-');
  const qNum = q.replace('Q', '');
  return `الربع ${qNum} - ${year}`;
}

/**
 * Generates only the 4 quarters of the current year
 */
export function getAvailableQuarters(): string[] {
  const currentYear = new Date().getFullYear();
  return [
    `Q1-${currentYear}`,
    `Q2-${currentYear}`,
    `Q3-${currentYear}`,
    `Q4-${currentYear}`,
  ];
}
