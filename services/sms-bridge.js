// services/sms-bridge.jsx
// Integration boundary for SMS sending. This file remains stable;
// native code will implement the same API and be auto-detected.
//
// API:
//   getCapability(): { mode: "native"|"simulated", canSend: boolean, notes: string }
//   onDeliveryReport(handler): () => void   // subscribe to async delivery receipts
//   sendSms({ to, message, requestDeliveryReport? }): Promise<{
//     status: "sent"|"delivered"|"failed",
//     messageId?: string,
//     reason?: string
//   }>
//
// Notes:
// - Expo-managed projects cannot silently send SMS; production Android native
//   module will plug in here (Phase 6).
// - This file exposes a small event hub so native can push delivery receipts.

/**
 * Native Module Contract (reference)
 *
 * Android (Kotlin):
 *  object SmsBridgeModule : ReactContextBaseJavaModule(...) {
 *    @ReactMethod
 *    fun sendSms(options: ReadableMap, promise: Promise) {
 *      // options: { to: String, message: String, requestDeliveryReport: Boolean }
 *      // result: { status: "sent"|"delivered"|"failed", messageId?: String, reason?: String }
 *      // When delivery receipt arrives later, emit:
 *      //   reactContext
 *      //     .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
 *      //     .emit("delivery", Arguments.createMap().apply {
 *      //        putString("messageId", id); putString("to", to); putString("status","delivered")
 *      //     })
 *    }
 *  }
 *
 * iOS (Swift):
 *  @objc(SmsBridge)
 *  class SmsBridge: RCTEventEmitter {
 *    @objc func sendSms(_ options: NSDictionary, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
 *      // Resolve with { status, messageId?, reason? }
 *      // Later, send delivery with sendEvent(withName: "delivery", body: ["messageId": id, "to": to, "status": "delivered"])
 *    }
 *    override func supportedEvents() -> [String]! { ["delivery"] }
 *  }
 *
 * JS API (stable):
 *   getCapability(): { mode: "native"|"simulated", canSend: boolean, notes: string }
 *   onDeliveryReport((evt) => {}): unsubscribe
 *   sendSms({ to, message, requestDeliveryReport? }): Promise<{ status, messageId?, reason? }>
 */

import { NativeEventEmitter, NativeModules, Platform } from "react-native";

// ------- tiny event hub for delivery reports -------
const deliverySubscribers = new Set();
/** @param {(evt:{messageId?:string,to?:string,status:"delivered"|"failed", reason?:string})=>void} handler */
export function onDeliveryReport(handler) {
  deliverySubscribers.add(handler);
  // lazily start native listener if present
  maybeStartNativeDeliveryListener();
  return () => deliverySubscribers.delete(handler);
}
function emitDelivery(evt) {
  for (const fn of deliverySubscribers) {
    try { fn(evt); } catch (_e) { /* noop */ }
  }
}

// ------- capability detection -------
function hasNative() {
  // Expecting a native module named SmsBridge with sendSms + (optional) events
  const mod = NativeModules?.SmsBridge;
  return !!(mod && typeof mod.sendSms === "function");
}
let nativeListenerStarted = false;
function maybeStartNativeDeliveryListener() {
  if (nativeListenerStarted) return;
  if (!hasNative()) return;

  try {
    const emitter = new NativeEventEmitter(NativeModules.SmsBridge);
    // Native side should emit an event named "delivery" with the shape:
    // { messageId, to, status: "delivered"|"failed", reason? }
    emitter.addListener("delivery", (evt) => emitDelivery(evt || {}));
    nativeListenerStarted = true;
  } catch {
    // If NativeEventEmitter isn’t wired, we simply skip; native can also call a direct
    // function SmsBridge.emitDelivery(JSON.stringify(evt)) and we can expose a bridge later.
  }
}

export function getCapability() {
  if (hasNative()) {
    return { mode: "native", canSend: true, notes: "Using NativeModules.SmsBridge" };
  }
  // For development/testing, allow simulated sending
  const expo = Platform.select({ ios: "Expo", android: "Expo", default: "JS" });
  return {
    mode: "simulated",
    canSend: true, // Enable simulated sending for testing
    notes: `${expo} runtime — using SMS simulator for testing.`,
  };
}

// ------- simulator (kept for dev and Expo) -------
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function simSend({ to, message, requestDeliveryReport }) {
  // Simulated send: random outcomes + optional delayed "delivered" event
  const base = 400 + Math.floor(Math.random() * 900);
  await sleep(base);

  // quick validation guard in sim
  if (!to || !/^\+923\d{9}$/.test(String(to))) {
    return { status: "failed", reason: "Invalid +92 recipient in simulator" };
  }
  if (!message || !String(message).trim()) {
    return { status: "failed", reason: "Empty message" };
  }

  const messageId = `sim-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const roll = Math.random();
  
  // Simulate success most of the time for testing
  if (roll < 0.05) return { status: "failed", reason: "Network error (sim)" };

  const deliveredNow = roll < 0.3; // sometimes returns delivered immediately
  if (deliveredNow) return { status: "delivered", messageId };

  // else "sent" now; optionally emit async delivery later
  if (requestDeliveryReport) {
    const later = 1200 + Math.floor(Math.random() * 3000);
    setTimeout(() => emitDelivery({ messageId, to, status: "delivered" }), later);
  }
  return { status: "sent", messageId };
}

// ------- native wrapper -------
async function nativeSend({ to, message, requestDeliveryReport }) {
  // Expected native signature: sendSms({ to, message, requestDeliveryReport }) -> Promise<...>
  try {
    const res = await NativeModules.SmsBridge.sendSms({ to, message, requestDeliveryReport: !!requestDeliveryReport });
    // Native should return the same shape; we coerce defensively:
    const out = {
      status: res?.status || "failed",
      messageId: res?.messageId,
      reason: res?.reason,
    };
    return out;
  } catch (e) {
    return { status: "failed", reason: e?.message || "Native send failed" };
  }
}

// ------- public API -------
/** @param {{to:string, message:string, requestDeliveryReport?:boolean}} payload */
export async function sendSms(payload) {
  if (hasNative()) return nativeSend(payload);
  return simSend(payload);
}

// (optional) testing hook to emit deliveries manually
export const __emitDeliveryForTests = emitDelivery;
