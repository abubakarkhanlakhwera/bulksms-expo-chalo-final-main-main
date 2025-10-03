// utils/phone-display.js
// Utility to convert phone numbers to local Pakistani format for display

export const toLocalPakistaniFormat = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  
  const phone = String(phoneNumber).trim();
  
  // If it's already in +92 format, convert to local 03xx format
  if (phone.startsWith('+923') && phone.length === 13) {
    return '0' + phone.slice(3); // +923012345678 -> 03012345678
  }
  
  // If it's in 923xxx format, convert to local 03xx format  
  if (phone.startsWith('923') && phone.length === 12) {
    return '0' + phone.slice(2); // 923012345678 -> 03012345678
  }
  
  // If it already starts with 0 and looks like Pakistani format, return as-is
  if (phone.startsWith('03') && phone.length === 11) {
    return phone;
  }
  
  // If it's just 3xxxxxxxx format (10 digits), add 0 prefix
  if (phone.match(/^3\d{9}$/)) {
    return '0' + phone;
  }
  
  // Return as-is if other format
  return phone;
};