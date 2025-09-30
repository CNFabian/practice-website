export const validateNumberInput = (
  value: string, 
  min: number = 0, 
  max: number = Infinity,
  allowDecimals: boolean = true
): string => {
  let cleanValue = value.replace(/[^0-9.-]/g, '');
  
  if (cleanValue === '' || cleanValue === '-') {
    return cleanValue === '-' ? '' : cleanValue;
  }
  
  const decimalIndex = cleanValue.indexOf('.');
  if (decimalIndex !== -1) {
    cleanValue = cleanValue.substring(0, decimalIndex + 1) + 
                 cleanValue.substring(decimalIndex + 1).replace(/\./g, '');
  }
  
  if (cleanValue.indexOf('-') > 0) {
    cleanValue = cleanValue.replace(/-/g, '');
  }
  if (cleanValue.split('-').length > 2) {
    cleanValue = '-' + cleanValue.replace(/-/g, '');
  }
  
  if (!allowDecimals && cleanValue.includes('.')) {
    cleanValue = cleanValue.split('.')[0];
  }
  
  const numValue = parseFloat(cleanValue);
  
  if (isNaN(numValue)) {
    return '';
  }
  
  if (numValue < min) {
    return min.toString();
  }
  
  if (numValue > max) {
    return max.toString();
  }
  
  return cleanValue;
};

export const validatePercentageInput = (value: string, max: number = 100): string => {
  return validateNumberInput(value, 0, max, true);
};

export const validateCurrencyInput = (value: string, max: number = 99999999): string => {
  return validateNumberInput(value, 0, max, true);
};

export const validateYearInput = (value: string): string => {
  return validateNumberInput(value, 1, 100, false);
};

export const validateInterestRateInput = (value: string): string => {
  return validateNumberInput(value, 0, 50, true);
};

export const validateCreditUtilizationInput = (value: string): string => {
  return validateNumberInput(value, 0, 100, true);
};

export const validateInquiriesInput = (value: string): string => {
  return validateNumberInput(value, 0, 20, false);
};