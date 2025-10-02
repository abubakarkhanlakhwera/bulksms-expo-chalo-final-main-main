// store/fileStore.js
// Minimal in-memory store (no external deps). Holds Phase 1 data: file meta, headers, rows, and mapping.
const listeners = new Set();

const state = {
  fileMeta: null, // { name, size, mime }
  headers: [],    // ["name","phone","message", ...]
  rows: [],       // [{...}]
  mapping: { name: null, phone: null, message: null }, // header choices
  // selection: set of row indices (relative to state.rows)
  selected: new Set(),
};

function notify() {
  for (const fn of listeners) fn(getState());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return {
    ...state,
    rowCount: state.rows.length,
    headerCount: state.headers.length,
    // expose a copy of selected to avoid accidental mutation from callers
    selected: state.selected ? new Set(state.selected) : new Set(),
  };
}

export function resetFile() {
  state.fileMeta = null;
  state.headers = [];
  state.rows = [];
  state.mapping = { name: null, phone: null, message: null };
  notify();
}

export function setFileMeta(meta) {
  state.fileMeta = meta;
  notify();
}

export function setParsed({ headers, rows }) {
  state.headers = headers || [];
  state.rows = Array.isArray(rows) ? rows : [];
  // best-guess auto-map by header names (case/space-insensitive)
  const norm = (s) => (s || "").toString().trim().toLowerCase().replace(/\s+/g, "");
  const H = new Map(state.headers.map((h) => [norm(h), h]));
  const guess = (want) =>
    H.get(want) || H.get(`_${want}`) || H.get(`${want}_`) || null;
  state.mapping = {
    name: guess("name"),
    phone: guess("phone") || H.get("mobile") || H.get("contact") || null,
    message: guess("message") || H.get("text") || H.get("sms") || null,
  };
  // reset selection for a newly parsed file
  state.selected = new Set();
  notify();
}

export function setMapping(next) {
  state.mapping = { ...state.mapping, ...next };
  notify();
}

// Selection helpers (used by Import/Preview UI)
export function setSelectedIndices(indices) {
  // Accept array or iterable of numbers
  state.selected = new Set(Array.isArray(indices) ? indices : Array.from(indices || []));
  notify();
}

export function toggleSelectedIndex(i) {
  const s = state.selected || new Set();
  if (s.has(i)) s.delete(i);
  else s.add(i);
  state.selected = s;
  notify();
}

export function clearSelected() {
  state.selected = new Set();
  notify();
}
