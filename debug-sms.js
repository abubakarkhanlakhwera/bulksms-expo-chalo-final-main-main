// Debug script to test SMS functionality
import { getCapability, sendSms } from './services/sms-bridge.js';

async function debugSMS() {
  console.log("=== SMS Debug Test ===");
  
  // Check capability
  const capability = getCapability();
  console.log("SMS Capability:", capability);
  
  // Test SMS send with a sample number
  const testNumber = "+923001234567"; // Sample Pakistani number
  const testMessage = "Test SMS from BulkSMS app";
  
  try {
    console.log(`\nTesting SMS send to: ${testNumber}`);
    console.log(`Message: ${testMessage}`);
    
    const result = await sendSms({
      to: testNumber,
      message: testMessage,
      requestDeliveryReport: true
    });
    
    console.log("SMS Send Result:", result);
  } catch (error) {
    console.error("SMS Send Error:", error);
  }
}

debugSMS();