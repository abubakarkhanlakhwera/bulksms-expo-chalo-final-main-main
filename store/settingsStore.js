// store/settingsStore.jsx
import { MAX_RATE_PER_MIN, MIN_RATE_PER_MIN } from "../constants/app";
import { loadSettings, saveSettings } from "../services/storage";

const listeners = new Set();
const state = {
  loaded: false,
  dailyCap: 700,
  // changed default daily cap to 500
  defaultRate: 5,
  notes: "",
  lastDailyCapReset: Date.now(),
};

function notify() { for (const fn of listeners) fn(getState()); }
export function subscribeSettings(fn){ listeners.add(fn); return () => listeners.delete(fn); }
export function getSettingsState(){ return getState(); }
export function getState(){ return { ...state }; }

export async function initSettings() {
  if (state.loaded) return getState();
  const s = await loadSettings();
  if (s) {
    state.dailyCap = Number(s.dailyCap) || state.dailyCap;
    // normalize loaded defaultRate to allowed range, fallback to current/default
    const loadedRate = Number(s.defaultRate);
    state.defaultRate = Number.isFinite(loadedRate)
      ? Math.max(MIN_RATE_PER_MIN, Math.min(MAX_RATE_PER_MIN, loadedRate))
      : state.defaultRate;
    state.notes = String(s.notes || "");
    state.lastDailyCapReset = Number(s.lastDailyCapReset) || Date.now();
  }
  // 24-hour reset logic
  const now = Date.now();
  if (now - state.lastDailyCapReset > 24 * 60 * 60 * 1000) {
    state.dailyCap = 500;
    state.lastDailyCapReset = now;
    await saveSettings({
      dailyCap: state.dailyCap,
      defaultRate: state.defaultRate,
      notes: state.notes,
      lastDailyCapReset: state.lastDailyCapReset,
    });
  }
  // If the stored value was outside the allowed range (or an old default), persist the normalized value
  try {
    const storedRate = Number(s?.defaultRate);
    if (s && Number.isFinite(storedRate) && storedRate !== state.defaultRate) {
      await saveSettings({ dailyCap: state.dailyCap, defaultRate: state.defaultRate, notes: state.notes, lastDailyCapReset: state.lastDailyCapReset });
    }
  } catch (_e) {}
  state.loaded = true;
  notify();
  return getState();
}

export async function updateSettings(partial) {
  if (partial.dailyCap != null) state.dailyCap = Math.max(1, Number(partial.dailyCap)||500);
  if (partial.defaultRate != null) {
    const v = Number(partial.defaultRate);
    state.defaultRate = Number.isFinite(v)
      ? Math.max(MIN_RATE_PER_MIN, Math.min(MAX_RATE_PER_MIN, v))
      : state.defaultRate;
  }
  if (partial.notes != null) state.notes = String(partial.notes);
  if (partial.lastDailyCapReset != null) state.lastDailyCapReset = Number(partial.lastDailyCapReset);
  const saved = await saveSettings({
    dailyCap: state.dailyCap,
    defaultRate: state.defaultRate,
    notes: state.notes,
    lastDailyCapReset: state.lastDailyCapReset,
  });
  notify();
  return saved;
}
