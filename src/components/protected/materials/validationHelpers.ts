export const validateNumberInput = (
  value: string, 
  min: number = 0, 
  max: number = Infinity,
  allowDecimals: boolean = true
): string => {
  // Remove any non-numeric characters except decimal point and minus sign
  let cleanValue = value.replace(/[^0-9.-]/g, '');
  
  // Handle empty string
  if (cleanValue === '' || cleanValue === '-') {
    return cleanValue === '-' ? '' : cleanValue;
  }
  
  // Remove extra decimal points (keep only the first one)
  const decimalIndex = cleanValue.indexOf('.');
  if (decimalIndex !== -1) {
    cleanValue = cleanValue.substring(0, decimalIndex + 1) + 
                 cleanValue.substring(decimalIndex + 1).replace(/\./g, '');
  }
  
  // Remove extra minus signs (keep only the first one if at beginning)
  if (cleanValue.indexOf('-') > 0) {
    cleanValue = cleanValue.replace(/-/g, '');
  }
  if (cleanValue.split('-').length > 2) {
    cleanValue = '-' + cleanValue.replace(/-/g, '');
  }
  
  // If decimals not allowed, remove decimal point and anything after
  if (!allowDecimals && cleanValue.includes('.')) {
    cleanValue = cleanValue.split('.')[0];
  }
  
  // Convert to number for validation
  const numValue = parseFloat(cleanValue);
  
  // Check if the number is valid
  if (isNaN(numValue)) {
    return '';
  }
  
  // Enforce min/max constraints
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