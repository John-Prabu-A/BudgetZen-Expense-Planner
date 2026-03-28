export const formatCurrency = (value: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '₹0.00';
  }
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCurrencyValue = (value: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0.00';
  }
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format currency with user preferences (for background jobs/notifications)
 * @param value - Amount to format
 * @param currencySign - Currency symbol (₹, $, €, £, ¥)
 * @param currencyPosition - Position of currency sign ('before' | 'after')
 * @param decimalPlaces - Number of decimal places (0-3)
 * @returns Formatted currency string
 */
export const formatCurrencyWithPreferences = (
  value: number,
  currencySign: string = '₹',
  currencyPosition: 'before' | 'after' = 'before',
  decimalPlaces: number = 2
): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    const zeroStr = Number(0).toLocaleString('en-IN', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    return currencyPosition === 'after' ? `${zeroStr}${currencySign}` : `${currencySign}${zeroStr}`;
  }

  const numStr = Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return currencyPosition === 'after' ? `${numStr}${currencySign}` : `${currencySign}${numStr}`;
};
