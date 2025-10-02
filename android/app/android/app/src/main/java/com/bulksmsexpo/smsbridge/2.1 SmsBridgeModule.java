package com.anonymous.bulksmsexpo.smsbridge;

import android.app.PendingIntent;
import android.content.Intent;
import android.telephony.SmsManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.UUID;

public class SmsBridgeModule extends ReactContextBaseJavaModule {
  static ReactApplicationContext reactContext;

  public static final String EVENT_DELIVERY = "delivery";
  public static final String ACTION_SENT = "com.anonymous.bulksmsexpo.SMS_SENT";
  public static final String ACTION_DELIVERED = "com.anonymous.bulksmsexpo.SMS_DELIVERED";

  public SmsBridgeModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @NonNull @Override
  public String getName() { return "SmsBridge"; }

  private static void emit(String event, WritableMap map) {
    if (reactContext == null) return;
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(event, map);
  }

  public static void emitDelivery(String messageId, String to, String status, String reason) {
    WritableMap m = Arguments.createMap();
    m.putString("messageId", messageId);
    m.putString("to", to);
    m.putString("status", status);
    if (reason != null) m.putString("reason", reason);
    emit(EVENT_DELIVERY, m);
  }

  private WritableMap makeResult(String status, String id, String reason) {
    WritableMap m = Arguments.createMap();
    m.putString("status", status);
    if (id != null) m.putString("messageId", id);
    if (reason != null) m.putString("reason", reason);
    return m;
  }

  @ReactMethod
  public void sendSms(ReadableMap payload, Promise promise) {
    try {
      String to = payload.hasKey("to") ? payload.getString("to") : null;
      String message = payload.hasKey("message") ? payload.getString("message") : null;
      boolean requestDelivery = payload.hasKey("requestDeliveryReport") && payload.getBoolean("requestDeliveryReport");

      if (to == null || to.isEmpty()) {
        promise.resolve(makeResult("failed", null, "No recipient"));
        return;
      }
      if (message == null || message.trim().isEmpty()) {
        promise.resolve(makeResult("failed", null, "Empty message"));
        return;
      }

      String messageId = "native-" + UUID.randomUUID().toString().substring(0, 8);

      Intent sent = new Intent(ACTION_SENT);
      sent.putExtra("messageId", messageId);
      sent.putExtra("to", to);

      Intent delivered = new Intent(ACTION_DELIVERED);
      delivered.putExtra("messageId", messageId);
      delivered.putExtra("to", to);

      int flags = PendingIntent.FLAG_UPDATE_CURRENT;
      if (android.os.Build.VERSION.SDK_INT >= 31) {
        flags |= PendingIntent.FLAG_MUTABLE;
      }

      PendingIntent sentPI = PendingIntent.getBroadcast(getReactApplicationContext(), messageId.hashCode(), sent, flags);
      PendingIntent delPI  = PendingIntent.getBroadcast(getReactApplicationContext(), messageId.hashCode()+1, delivered, flags);

      SmsManager sms = SmsManager.getDefault();
      ArrayList<String> parts = sms.divideMessage(message);

      if (parts.size() > 1) {
        ArrayList<PendingIntent> sPis = new ArrayList<>();
        ArrayList<PendingIntent> dPis = new ArrayList<>();
        for (int i = 0; i < parts.size(); i++) {
          sPis.add(sentPI);
          dPis.add(requestDelivery ? delPI : null);
        }
        sms.sendMultipartTextMessage(to, null, parts, sPis, requestDelivery ? dPis : null);
      } else {
        sms.sendTextMessage(to, null, message, sentPI, requestDelivery ? delPI : null);
      }

      promise.resolve(makeResult("sent", messageId, null));
    } catch (Exception e) {
      promise.resolve(makeResult("failed", null, e.getMessage()));
    }
  }
}
