/**
 * Date validation utility adhering to strict Gregorian calendar rules:
 * - 31 days for: January, March, May, July, August, October, December
 * - 30 days for: April, June, September, November
 * - 28/29 days for: February (29 in leap years, 28 in standard years)
 * - Standard display format: DD/MM/YYYY
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function isLeapYear(year) {
  const y = Number(year);
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

export function getDaysInMonth(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (m < 1 || m > 12) return 0;
  if (m === 2) {
    return isLeapYear(y) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(m)) {
    return 30;
  }
  return 31;
}

export function parseDateParts(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      return {
        year: parseInt(isoMatch[1], 10),
        month: parseInt(isoMatch[2], 10),
        day: parseInt(isoMatch[3], 10)
      };
    }
    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      return {
        day: parseInt(dmyMatch[1], 10),
        month: parseInt(dmyMatch[2], 10),
        year: parseInt(dmyMatch[3], 10)
      };
    }
  } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return {
      year: dateInput.getFullYear(),
      month: dateInput.getMonth() + 1,
      day: dateInput.getDate()
    };
  }
  return null;
}

export function validateDateMonthDays(dateInput) {
  const parts = parseDateParts(dateInput);
  if (!parts) {
    return { valid: false, error: 'Invalid date format. Expected DD/MM/YYYY or YYYY-MM-DD.' };
  }
  const { year, month, day } = parts;

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12.' };
  }

  if (year < 1900 || year > 2200) {
    return { valid: false, error: 'Year must be a valid 4-digit year.' };
  }

  const maxDays = getDaysInMonth(month, year);
  const monthName = MONTH_NAMES[month - 1];

  if (day < 1 || day > maxDays) {
    if (month === 2) {
      return {
        valid: false,
        error: isLeapYear(year)
          ? `February ${year} is a leap year and has only 29 days (Day ${day} is invalid).`
          : `February ${year} has only 28 days (Day ${day} is invalid).`
      };
    }
    return {
      valid: false,
      error: `${monthName} has only ${maxDays} days. Day ${day} is invalid.`
    };
  }

  return {
    valid: true,
    error: null,
    year,
    month,
    day,
    maxDays,
    formattedDMY: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  };
}

export function formatDateDMY(dateInput) {
  if (!dateInput) return '';

  if (typeof dateInput === 'string' && /^\d{4}[-/]\d{2}[-/]\d{2}/.test(dateInput)) {
    const parts = dateInput.split('T')[0].split(/[-/]/);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }

  if (typeof dateInput === 'string' && /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(dateInput)) {
    const parts = dateInput.split(/[-/]/);
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return String(dateInput);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export default {
  MONTH_NAMES,
  isLeapYear,
  getDaysInMonth,
  parseDateParts,
  validateDateMonthDays,
  formatDateDMY
};
