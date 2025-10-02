// store/validationStore.jsx
// Holds validation output and simple selectors for UI.

const listeners = new Set();

const state = {
  validated: [], // array of ValidatedRow
  counts: { total: 0, valid: 0, invalid: 0 },
  lastUpdatedBy: null,
  lastUpdatedAt: null,
};

function notify() {
  for (const fn of listeners) fn(getState());
}

export function subscribeValidation(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getValidationState() {
  return getState();
}

export function getState() {
  return {
    ...state,
    validRows: state.validated.filter((r) => r.valid),
    invalidRows: state.validated.filter((r) => !r.valid),
    lastUpdatedBy: state.lastUpdatedBy,
    lastUpdatedAt: state.lastUpdatedAt,
  };
}

export function setValidationResult({ rows, counts }) {
  // Protective guard: if the file store exists and its selection is explicitly empty,
  // reject attempts to set a non-empty validation result. This prevents accidental
  // full-file validation when the user intentionally deselected all rows.
  try {
    // require here to avoid circular import issues at module load
    const { getState: getFileState } = require("./fileStore");
    const fs = getFileState();
    const sel = fs && fs.selected ? fs.selected : null;
    if (sel && sel instanceof Set && sel.size === 0) {
      // selection explicitly empty — clear validation instead of accepting incoming rows
      state.validated = [];
      state.counts = { total: 0, valid: 0, invalid: 0 };
  state.lastUpdatedBy = 'setValidationResult-guarded';
  state.lastUpdatedAt = Date.now();
  // debug log
  // debug logs removed
  notify();
      return;
    }
    // If selection is non-empty, require incoming rows length to match selection size.
    if (sel && sel instanceof Set && sel.size > 0) {
      const incomingLen = Array.isArray(rows) ? rows.length : 0;
      if (incomingLen !== sel.size) {
        // incoming validation doesn't match explicit selection size — ignore
        return;
      }
    }
  } catch (_err) {
    // ignore and continue if fileStore can't be loaded for any reason
  }

  state.validated = Array.isArray(rows) ? rows : [];
  state.counts = counts || { total: 0, valid: 0, invalid: 0 };
  state.lastUpdatedBy = 'setValidationResult';
  state.lastUpdatedAt = Date.now();
  // debug logs removed
  notify();
}

export function resetValidation() {
  state.validated = [];
  state.counts = { total: 0, valid: 0, invalid: 0 };
  state.lastUpdatedBy = 'resetValidation';
  state.lastUpdatedAt = Date.now();
  notify();
}
