/**
 * Simplified timezone utilities - using UTC consistently
 */

// Always use UTC
export const getUserTimezone = () => {
  return 'UTC';
};

// Always return UTC
export const getTimezoneAbbreviation = () => {
  return 'UTC';
};

// Convert local datetime to UTC ISO string
export const localToUTC = (localDateTimeString) => {
  if (!localDateTimeString) return null;
  
  const localDate = new Date(localDateTimeString);
  if (isNaN(localDate.getTime())) return null;
  
  return localDate.toISOString();
};

// Convert UTC datetime string to local datetime string for input field
export const utcToLocalInput = (utcString) => {
  if (!utcString) return '';
  
  const utcDate = new Date(utcString);
  if (isNaN(utcDate.getTime())) return '';
  
  // Format as YYYY-MM-DDTHH:mm for datetime-local input (in UTC)
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  const hours = String(utcDate.getUTCHours()).padStart(2, '0');
  const minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert UTC datetime to UTC formatted display string
export const utcToLocalDisplay = (utcString, options = {}) => {
  if (!utcString) return '';
  
  const utcDate = new Date(utcString);
  if (isNaN(utcDate.getTime())) return '';
  
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    return utcDate.toLocaleString(undefined, mergedOptions);
  } catch (error) {
    // Fallback for older browsers
    return utcDate.toUTCString();
  }
};

// Format datetime with UTC info
export const formatWithTimezone = (utcString, options = {}) => {
  const utcString_display = utcToLocalDisplay(utcString, options);
  return `${utcString_display} (UTC)`;
};

// Check if a date is in the future (considering UTC)
export const isFutureDateTime = (localDateTimeString) => {
  if (!localDateTimeString) return false;
  
  const localDate = new Date(localDateTimeString);
  const now = new Date();
  
  return localDate > now;
};

// Get default datetime (1 hour from now in UTC)
export const getDefaultDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  
  // Round to nearest 15 minutes
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  now.setMinutes(roundedMinutes);
  
  // Format as UTC time for datetime-local input
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes_final = String(now.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes_final}`;
};
