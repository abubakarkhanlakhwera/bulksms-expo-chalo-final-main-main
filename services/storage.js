// services/storage.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";

const K_SETTINGS = "app.settings.v1";
const K_LASTSESSION = "app.lastsession.v1";
const K_QUEUE = "app.queue.v1";

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

export async function loadQueueSnapshot() {
  try {
    const raw = await AsyncStorage.getItem(K_QUEUE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveQueueSnapshot(snapshot) {
  const items = Array.isArray(snapshot?.items)
    ? snapshot.items.map((item) => ({ ...item }))
    : [];

  const safe = {
    items,
    ratePerMin: Number(snapshot?.ratePerMin) || 5,
    running: !!snapshot?.running,
    startedAt: Number(snapshot?.startedAt) || 0,
    completedAt: Number(snapshot?.completedAt) || 0,
    scheduledFor: Number(snapshot?.scheduledFor) || 0,
    dailyCounts: {
      sent: Number(snapshot?.dailyCounts?.sent) || 0,
      delivered: Number(snapshot?.dailyCounts?.delivered) || 0,
    },
    lastCountsReset: Number(snapshot?.lastCountsReset) || Date.now(),
    savedAt: Date.now(),
  };

  await AsyncStorage.setItem(K_QUEUE, JSON.stringify(safe));
  return safe;
}

export async function clearQueueSnapshot() {
  await AsyncStorage.removeItem(K_QUEUE);
}

