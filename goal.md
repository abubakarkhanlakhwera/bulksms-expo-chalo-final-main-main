What you’re building

A local-only Bulk SMS app built with React Native + Expo (your given project hierarchy, JSX screens).
It imports a CSV/XLSX file with exactly three columns — name, phone, message — validates rows, and then queues & sends those messages from your device SIM with rate control, basic delivery status, and reporting.
This is for personal sideloaded use (not Play Store). No message templates—each row’s message is sent as-is.

Must-have behavior

File Import: Pick .csv/.xlsx, map headers to name/phone/message.

Validation:

Normalize Pakistan numbers (03xxxxxxxxx → +92xxxxxxxxxx, 3xxxxxxxxx → +92…, keep +92…).

Check empty messages / invalid phones.

Estimate parts (GSM-7 ≈ 153 chars/part, UCS-2 ≈ 67).

Preview & Dry-run: Totals (Total/Valid/Invalid), parts warnings, filter lists.

Queue & Sending UI: Start / Pause / Stop, rate control (e.g., 0.5–3 SMS/sec) with slight jitter; per-row status: queued → sending → sent → delivered → failed.

Reporting: KPIs (Sent/Delivered/Failed, avg parts), export failed rows (CSV string).

Settings: Daily cap (e.g., ~1000/day), default rate, simple persistence.

Important constraints (truth you should plan for)

Silent programmatic SMS requires native Android APIs. Pure managed Expo cannot send silently; you’ll run Expo prebuild and add a tiny native bridge later (kept behind a services/sms-bridge.js boundary).

On some Android versions, becoming Default SMS app improves/permits programmatic sending.

Compliance is your responsibility (consent, STOP/DND, reasonable rates) to avoid carrier blocks.

Screens (strictly matching your structure)

app/_layout.jsx – global header/shell

app/index.jsx – dashboard & quick actions

app/import.jsx – pick file, map headers

app/preview.jsx – validation & dry-run

app/queue.jsx – live send console (rate + statuses)

app/report.jsx – KPIs + export failed

app/settings.jsx – caps, defaults, notes

Core components you’ll reuse

File picker card, column mapper, validation summary, recipient list (virtualized), queue controls, progress bar, KPI stat cards, toolbar, empty state.

Data shapes (so everything plugs together cleanly)

RawRow: { name, phone, message }

ValidatedRow: { id, name, phoneRaw, phoneNormalized, message, parts, valid, reason? }

QueueItem: { id, phone, message, parts, status:'queued'|'sending'|'sent'|'delivered'|'failed', attempts, errorCode? }

Metrics: { total, valid, sent, delivered, failed, avgParts, durationMs }

End-to-end flow

Import → Validate → Preview/Dry-run → Queue (rate-controlled) → Report/Export, with Settings informing caps/rates.
A native SMS bridge slots in later without changing screens (thanks to the services/sms-bridge.js boundary).

What’s deliberately not included (for now)

Play Store distribution, WhatsApp/OTT messaging, server/gateway backend, message templates, contact sync.