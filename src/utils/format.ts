/**
 * Indian currency & date formatting utilities
 */

export function formatINR(amount: number | null | undefined, includeSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const fixed = absAmount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  let formattedInt = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    let remaining = integerPart.substring(0, integerPart.length - 3);
    const groups: string[] = [];

    while (remaining.length > 2) {
      groups.unshift(remaining.substring(remaining.length - 2));
      remaining = remaining.substring(0, remaining.length - 2);
    }
    if (remaining.length > 0) {
      groups.unshift(remaining);
    }
    formattedInt = groups.join(',') + ',' + lastThree;
  } else {
    formattedInt = integerPart;
  }

  const prefix = includeSymbol ? '₹' : '';
  const sign = isNegative ? '-' : '';
  return `${sign}${prefix}${formattedInt}.${decimalPart}`;
}

export function formatDateIN(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(yearMonth: string): string {
  try {
    const [year, month] = yearMonth.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch {
    return yearMonth;
  }
}
