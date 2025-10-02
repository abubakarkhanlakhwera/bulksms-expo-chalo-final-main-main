// services/permissions.jsx
// Expo-safe placeholder for SMS-related permissions.
// Phase 6 will replace these with real Android-native checks.

export async function hasSmsPermission() {
  // In Expo managed runtime we can't silently send SMS; return false by default.
  return { granted: false, platform: "expo", note: "Native SMS permission requires prebuild." };
}

export async function ensureSmsPermissionAsync() {
  // No-op request in Expo. Wire real Permission APIs during native integration.
  return { granted: false, requested: false, platform: "expo" };
}
