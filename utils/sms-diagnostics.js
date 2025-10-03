// utils/sms-diagnostics.js
// SMS Delivery Diagnostic Tool

import { Alert } from "react-native";
import { getCapability, onDeliveryReport, sendSms } from "../services/sms-bridge";

export const runSMSDiagnostics = async () => {
  const results = [];
  
  // Check capability
  const capability = getCapability();
  results.push(`SMS Bridge Mode: ${capability.mode}`);
  results.push(`Can Send: ${capability.canSend}`);
  results.push(`Notes: ${capability.notes}`);
  
  // Test with a single SMS
  try {
    const testNumber = "+923066987889"; // Using a number from your screenshot
    const testMessage = "Test SMS from BulkSMS App - Diagnostic Check";
    
    results.push(`\nTesting SMS to: ${testNumber}`);
    results.push(`Message: ${testMessage}`);
    
    // Subscribe to delivery reports
    const unsubscribe = onDeliveryReport((event) => {
      results.push(`\nDelivery Report Received:`);
      results.push(`Message ID: ${event.messageId}`);
      results.push(`To: ${event.to}`);
      results.push(`Status: ${event.status}`);
      if (event.reason) results.push(`Reason: ${event.reason}`);
    });
    
    const result = await sendSms({
      to: testNumber,
      message: testMessage,
      requestDeliveryReport: true
    });
    
    results.push(`\nSend Result:`);
    results.push(`Status: ${result.status}`);
    if (result.messageId) results.push(`Message ID: ${result.messageId}`);
    if (result.reason) results.push(`Reason: ${result.reason}`);
    
    // Wait a bit for delivery report
    setTimeout(() => {
      unsubscribe();
      Alert.alert("SMS Diagnostics Complete", results.join("\n"));
    }, 5000);
    
  } catch (error) {
    results.push(`\nError: ${error.message}`);
    Alert.alert("SMS Diagnostics", results.join("\n"));
  }
};

export const checkSMSPermissions = () => {
  // This would need to be implemented in native code
  // For now, we'll show what to check manually
  Alert.alert(
    "Manual Permission Check",
    "Please check the following:\n\n" +
    "1. Go to Settings > Apps > Your App > Permissions\n" +
    "2. Ensure 'SMS' permission is granted\n" +
    "3. Check if 'Phone' permission is also granted\n" +
    "4. Some devices need 'Default SMS App' permission\n" +
    "5. Check if device has active SIM card\n" +
    "6. Verify network signal strength"
  );
};

export const commonSMSIssues = [
  {
    issue: "Permission Denied",
    solution: "Grant SMS permission in device settings",
    code: "RESULT_ERROR_GENERIC_FAILURE"
  },
  {
    issue: "No Network",
    solution: "Check mobile network connection",
    code: "RESULT_ERROR_NO_SERVICE"
  },
  {
    issue: "Invalid Number",
    solution: "Use correct format: +923XXXXXXXXX",
    code: "Invalid recipient"
  },
  {
    issue: "SIM Card Issue",
    solution: "Check if SIM card is properly inserted",
    code: "RESULT_ERROR_GENERIC_FAILURE"
  },
  {
    issue: "Carrier Blocking",
    solution: "Some carriers block bulk SMS, try different numbers",
    code: "RESULT_ERROR_GENERIC_FAILURE"
  },
  {
    issue: "Message Too Long",
    solution: "Keep messages under 160 characters for single SMS",
    code: "Message length exceeded"
  }
];

export const showTroubleshootingGuide = () => {
  const guide = commonSMSIssues
    .map(item => `• ${item.issue}: ${item.solution}`)
    .join("\n\n");
    
  Alert.alert(
    "SMS Troubleshooting Guide",
    guide,
    [{ text: "OK" }]
  );
};