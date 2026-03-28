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
