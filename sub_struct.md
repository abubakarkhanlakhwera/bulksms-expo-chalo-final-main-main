Phase 1 — Import flow (files → memory)

Goal: Pick CSV/XLSX, map columns, hold rows in memory.

Screens:

app/import.jsx (file pick & column mapping UI)

app/preview.jsx (show a first look at rows)

Components:

components/FilePickerCard.jsx

components/ColumnMapper.jsx

Logic:

modules/parsing/csv.js & modules/parsing/xlsx.js (return uniform rows[])

store/fileStore.js (file meta + raw rows)

Docs: docs/DATA_FORMAT.txt (header rules & sample rows)

Done when: After import, you can see row count and mapped columns on Preview.

Phase 2 — Validation & hygiene

Goal: Split into valid/invalid; estimate SMS parts.

Logic:

modules/validation/phone.js (normalize +92, GSM-7, parts estimate)

modules/validation/rules.js (empty message, invalid number, length caps)

State: store/validationStore.js (valid[], invalid[], counts)

Components:

components/ValidationSummary.jsx (Total/Valid/Invalid/Warnings)

components/RecipientList.jsx (paged/virtualized list)

components/EmptyState.jsx

Screen: Enhance app/preview.jsx with filters (All/Valid/Invalid).

Done when: Preview shows valid vs invalid with per-row reasons and parts.

Phase 3 — Queue console (simulated engine first)

Goal: Turn valid rows into a send queue; control rate & status transitions.

Logic:

modules/queue/state.js (queued → sending → sent → delivered → failed)

modules/queue/scheduler.js (rate, jitter, backoff policy)

State: store/queueStore.js (items, running flags, counters, progress)

Components:

components/QueueControls.jsx (Start/Pause/Stop, rate input/slider)

components/ProgressBar.jsx

components/RecipientList.jsx (reuse; now shows status chips)

Screen: app/queue.jsx (live console view)

Constants: constants/app.js (rate defaults, caps), constants/messages.js (UI copy)

Done when: You can start/pause/stop a simulated queue and see per-row status change.

Phase 4 — Reporting & export

Goal: Summarize delivery metrics and export failed rows.

Logic:

modules/analytics/metrics.js (Sent/Delivered/Failed, avg parts, duration)

modules/export/csv-export.js (“failed-only” CSV as a string)

Components:

components/StatCard.jsx (KPIs)

components/Toolbar.jsx (Export, Settings)

Screen: app/report.jsx (totals + export actions)

Done when: Report shows live KPIs; clicking Export produces a CSV string (UI stub ok).

Phase 5 — Settings & persistence

Goal: Save preferences and last session details.

Screen: app/settings.jsx (daily cap, default rate, notes)

Services:

services/storage.js (persist/retrieve settings, last file)

services/permissions.js (document prompts; wire later)

State: store/settingsStore.js (rate, caps, SIM preference for UI only)

Done when: Settings persist across reload; queue uses stored defaults.

Phase 6 — Integration boundary (kept as stub)

Goal: Keep a clean seam for future native SMS.

Service: services/sms-bridge.js (API shape only: send(), onStatus() callbacks)

Hooks:

hooks/useImportFlow.js (orchestrate import → validation → stores)

hooks/useQueueRunner.js (drives scheduler; subscribes to sms-bridge events)

hooks/useMetrics.js (derive KPIs for report)

Done when: Switching from simulated to real bridge later won’t touch screens/components.

Phase 7 — UX polish & top bar

Goal: Smooth edges & global actions.

Components:

components/Toolbar.jsx on Home and Report (Import, Export, Settings)

Utils:

utils/format.js (numbers, durations, percentages)

utils/platform.js (guards/flags)

Done when: Navigation between Import → Preview → Queue → Report feels seamless, with consistent toolbar actions.

Phase 8 — Docs & tests

Goal: Lock contracts and catch regressions.

Docs:

docs/DESIGN.txt (final UX + data contracts)

docs/NATIVE_INTEGRATION.txt (how to wire Android SmsManager later)

Tests:

tests/parsing.spec.js (CSV/XLSX edge cases)

tests/validation.spec.js (normalization, parts calc)

tests/queue.spec.js (rate/backoff/state transitions)

Done when: Tests pass for parsing, validation, and queue logic; docs reflect the built flow.

Workboard (what to build, in order)

Shell: _layout.jsx, index.jsx

Import: FilePickerCard.jsx, ColumnMapper.jsx, modules/parsing/*, fileStore.js, import.jsx

Validate: modules/validation/*, validationStore.js, ValidationSummary.jsx, RecipientList.jsx, preview.jsx

Queue console: queue/state.js, queue/scheduler.js, queueStore.js, QueueControls.jsx, ProgressBar.jsx, queue.jsx

Report & export: analytics/metrics.js, export/csv-export.js, StatCard.jsx, Toolbar.jsx, report.jsx

Settings & persistence: settings.jsx, services/storage.js, services/permissions.js, settingsStore.js

Integration seam: services/sms-bridge.js, hooks/useQueueRunner.js, hooks/useImportFlow.js, hooks/useMetrics.js

Polish + docs + tests: utils/*, docs/*, tests/*