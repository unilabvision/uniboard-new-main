/**
 * Parse LMS price inputs. Accepts numbers and TR/EN decimal strings
 * (e.g. "1.234,56", "1234,56", "1,234.56", "99.90").
 */
export function parsePrice(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 'invalid';
  }

  let s = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/₺|TL|TRY/gi, '');

  if (!s) return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Last separator is the decimal; the other is thousands.
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      // 1.234,56
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    // 1234,56 or 1,234 (treat single comma-group of 3 digits as thousands)
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      s = `${parts[0]}.${parts[1]}`;
    } else {
      s = s.replace(/,/g, '');
    }
  }

  if (!/^-?\d+(\.\d+)?$/.test(s)) return 'invalid';

  const num = Number(s);
  return Number.isFinite(num) ? num : 'invalid';
}
