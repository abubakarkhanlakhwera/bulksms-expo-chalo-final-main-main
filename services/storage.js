// services/storage.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";

const K_SETTINGS = "app.settings.v1";
const K_LASTSESSION = "app.lastsession.v1";

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(K_SETTINGS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(settings) {
  const safe = {
    dailyCap: Number(settings?.dailyCap) || 500,
    defaultRate: Number(settings?.defaultRate) || 5,
    notes: String(settings?.notes || ""),
    lastDailyCapReset: Number(settings?.lastDailyCapReset) || Date.now(),
  };
  await AsyncStorage.setItem(K_SETTINGS, JSON.stringify(safe));
  return safe;
}

export async function loadLastSession() {
  try {
    const raw = await AsyncStorage.getItem(K_LASTSESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveLastSession({ fileMeta, mapping }) {
  const snapshot = {
    fileMeta: fileMeta
      ? { name: fileMeta.name, size: fileMeta.size, mime: fileMeta.mime }
      : null,
    mapping: mapping || null,
    savedAt: Date.now(),
  };
  await AsyncStorage.setItem(K_LASTSESSION, JSON.stringify(snapshot));
  return snapshot;
}

export async function clearLastSession() {
  await AsyncStorage.removeItem(K_LASTSESSION);
}

