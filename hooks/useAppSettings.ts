import { usePreferences } from '@/context/Preferences';

export const useAppSettings = () => {
  const {
    theme,
    uiMode,
    currencySign,
    currencyPosition,
    decimalPlaces,
  } = usePreferences();

  const formatNumber = (value: number) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return (0).toLocaleString('en-IN', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });
    }
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  /**
   * Formats a number with currency sign in correct position based on user preferences
   * @param value - The numeric value to format
   * @returns Formatted currency string (e.g., "₹100.50" or "100.50€" based on currencyPosition)
   */
  const formatCurrency = (value: number) => {
    const numStr = formatNumber(value);
    return currencyPosition === 'after' ? `${numStr}${currencySign}` : `${currencySign}${numStr}`;
  };

  /**
   * Formats only the numeric part without currency sign
   * Useful for cases where you need to position the currency sign manually
   * @param value - The numeric value to format
   * @returns Formatted number string (e.g., "100.50")
   */
  const formatCurrencyValue = (value: number) => formatNumber(value);

  /**
   * Same as formatCurrency - respects user's currency position preference
   * Kept for backward compatibility and clarity
   * @param value - The numeric value to format
   * @returns Formatted currency string with sign in correct position
   */
  const formatCurrencyWithPosition = (value: number) => {
    const numStr = formatNumber(value);
    return currencyPosition === 'after' ? `${numStr}${currencySign}` : `${currencySign}${numStr}`;
  };

  return {
    // Appearance
    theme,
    uiMode,

    // Currency
    currencySign,
    currencyPosition,
    decimalPlaces,
    formatCurrency,
    formatCurrencyValue,
    formatCurrencyWithPosition,
  } as const;
};

export default useAppSettings;
