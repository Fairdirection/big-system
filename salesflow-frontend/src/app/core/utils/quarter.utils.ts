/**
 * Returns quarter ID string — e.g. "Q2-2026"
 * Mirrors backend src/utils/quarter.utils.js getQuarterId()
 */
export function getQuarterId(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${q}-${date.getFullYear()}`;
}

/**
 * Formats quarter ID for display.
 * ar: "الربع 2 - 2026" | en: "Q2 - 2026"
 */
export function formatQuarter(quarterId: string, lang: 'ar' | 'en' = 'ar'): string {
  if (!quarterId) return '';
  const [q, year] = quarterId.split('-');
  const qNum = q.replace('Q', '');
  if (lang === 'en') return `Q${qNum} - ${year}`;
  return `الربع ${qNum} - ${year}`;
}

/** Returns sorted unique years covered by getAvailableQuarters() */
export function getAvailableYears(yearsBefore = 2, yearsAfter = 1): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + yearsAfter; y >= current - yearsBefore; y--) years.push(y);
  return years;
}

/**
 * Generates all quarters from `startYear` through `endYear` (inclusive),
 * ordered newest-first so the current quarter appears at the top of selectors.
 */
export function getAvailableQuarters(yearsBefore = 2, yearsAfter = 1): string[] {
  const currentYear = new Date().getFullYear();
  const quarters: string[] = [];
  for (let y = currentYear + yearsAfter; y >= currentYear - yearsBefore; y--) {
    for (let q = 4; q >= 1; q--) {
      quarters.push(`Q${q}-${y}`);
    }
  }
  return quarters;
}
