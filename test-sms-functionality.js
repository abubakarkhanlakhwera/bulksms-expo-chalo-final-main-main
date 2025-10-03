// test-sms-functionality.js
// Run this in your app console to test SMS functionality

import { getCapability, sendSms } from './services/sms-bridge';

export async function testSMSFunctionality() {
  console.log("🔍 Testing SMS Functionality...");
  
  // Check capability
  const capability = getCapability();
  console.log("📋 SMS Capability:", capability);
  
  if (!capability.canSend) {
    console.log("❌ SMS sending is disabled. Check native module integration.");
    return;
  }
  
  // Test with the numbers from your screenshot
  const testNumbers = [
    "+923066987889", // From your screenshot
    "+923001234567"  // Test number
  ];
  
  const testMessage = "Test SMS from BulkSMS App - Function Check 📱";
  
  for (const number of testNumbers) {
    try {
      console.log(`\n📤 Sending test SMS to: ${number}`);
      console.log(`📝 Message: ${testMessage}`);
      
      const result = await sendSms({
        to: number,
        message: testMessage,
        requestDeliveryReport: true
      });
      
      console.log(`📊 Result for ${number}:`, result);
      
      if (result.status === "sent" || result.status === "delivered") {
        console.log(`✅ SMS sent successfully to ${number}`);
      } else {
        console.log(`❌ SMS failed to ${number}: ${result.reason}`);
      }
      
      // Wait a bit between sends
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`💥 Error sending to ${number}:`, error);
    }
  }
  
  console.log("\n🏁 SMS functionality test completed!");
}

// You can call this function from your app's debug console
console.log("📱 SMS Test Script Loaded. Call testSMSFunctionality() to run tests.");