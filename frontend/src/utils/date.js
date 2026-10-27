/**
 * Standard Date Formatter for Max Housekeeping Service
 * Guarantees DD.MM.YYYY format across all UI views (e.g. 27.10.2026)
 */

export function formatDateDMY(dateInput) {
  if (!dateInput) return '';

  // Handle YYYY-MM-DD or ISO strings directly without timezone skew
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return String(dateInput);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
}

export function formatDateTimeDMY(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return formatDateDMY(dateInput);
  }

  const dateStr = formatDateDMY(d);
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${dateStr} at ${timeStr}`;
}

export default {
  formatDateDMY,
  formatDateTimeDMY
};
