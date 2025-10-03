// utils/debug-phone-format.js
// Debug utility to check phone number formats

export const debugPhoneFormats = (validatedRows) => {
  if (!validatedRows || validatedRows.length === 0) {
    console.log("No validated rows found");
    return;
  }

  console.log("=== Phone Format Debug ===");
  validatedRows.slice(0, 5).forEach((row, index) => {
    console.log(`Row ${index + 1}:`);
    console.log(`  Name: ${row.name}`);
    console.log(`  phoneRaw: "${row.phoneRaw}"`);
    console.log(`  phoneNormalized: "${row.phoneNormalized}"`);
    console.log(`  Valid: ${row.valid}`);
    console.log("---");
  });
};