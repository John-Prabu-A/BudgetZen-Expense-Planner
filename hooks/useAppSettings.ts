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

  const formatCurrency = (value: number) => {
    const numStr = formatNumber(value);
    return currencyPosition === 'after' ? `${numStr}${currencySign}` : `${currencySign}${numStr}`;
  };

  const formatCurrencyValue = (value: number) => formatNumber(value);

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
  } as const;
};

export default useAppSettings;
