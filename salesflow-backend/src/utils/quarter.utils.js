/**
 * Detects the quarter ID for a given date.
 * @param {Date} date 
 * @returns {string} e.g. "Q2-2026"
 */
function getQuarterId(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  const q = Math.ceil(month / 3); // 1, 2, 3, or 4
  return `Q${q}-${year}`;
}

/**
 * Gets the start and end dates for a given quarter ID, normalized for 30-day months.
 * @param {string} quarterId 
 * @returns {{start: Date, end: Date}}
 */
function getQuarterBounds(quarterId) {
  const [qStr, yearStr] = quarterId.split('-');
  const qNum = parseInt(qStr.replace('Q', ''));
  const year = parseInt(yearStr);
  
  const startMonth = (qNum - 1) * 3;
  const endMonth = qNum * 3 - 1; // 0-indexed: 2, 5, 8, 11
  
  const start = new Date(year, startMonth, 1);
  // For the 30-day rule, we'll treat the "end" of the quarter as the 30th of the last month.
  const end = new Date(year, endMonth, 30, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Calculates working days between two dates, treating every month as 30 days.
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {number}
 */
function calculateWorkingDays(startDate, endDate) {
  const d1 = new Date(startDate);
  const d2 = new Date(endDate || new Date());
  
  if (d2 < d1) return 0;

  const y1 = d1.getFullYear();
  const m1 = d1.getMonth(); // 0-11
  const day1 = Math.min(30, d1.getDate());

  const y2 = d2.getFullYear();
  const m2 = d2.getMonth(); // 0-11
  const day2 = Math.min(30, d2.getDate());

  // (Year2 - Year1) * 360 + (Month2 - Month1) * 30 + (Day2 - Day1) + 1
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (day2 - day1) + 1;
}

/**
 * Calculates working days for an employee within a quarter across their team history.
 * @param {Array} historyRecords 
 * @param {string} quarterId 
 * @param {boolean} untilToday - If true, calculates only up to current date.
 * @returns {number}
 */
function calculateEmployeeQuarterDays(historyRecords, quarterId, untilToday = false) {
  const { start: qStart, end: qEnd } = getQuarterBounds(quarterId);
  const limit = untilToday ? new Date() : qEnd;
  const qLimit = new Date(Math.min(qEnd.getTime(), limit.getTime()));

  let totalDays = 0;

  for (const record of historyRecords) {
    const effectiveStart = new Date(Math.max(qStart.getTime(), new Date(record.joinDate).getTime()));
    
    // If the employee is still in the team (leaveDate is null), 
    // use qLimit (either end of quarter or today)
    const leaveDate = record.leaveDate ? new Date(record.leaveDate) : qLimit;
    const effectiveEnd = new Date(Math.min(qLimit.getTime(), leaveDate.getTime()));
    
    if (effectiveEnd >= effectiveStart) {
      totalDays += calculateWorkingDays(effectiveStart, effectiveEnd);
    }
  }

  return totalDays;
}

module.exports = { 
  getQuarterId, 
  getQuarterBounds, 
  calculateWorkingDays, 
  calculateEmployeeQuarterDays 
};
