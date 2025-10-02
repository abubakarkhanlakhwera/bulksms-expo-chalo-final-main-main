package com.anonymous.bulksmsexpo.smsbridge;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class Receivers {

  public static class SentReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
      String id = intent.getStringExtra("messageId");
      String to = intent.getStringExtra("to");
      if (getResultCode() != Activity.RESULT_OK) {
        SmsBridgeModule.emitDelivery(id, to, "failed", "send-result:" + getResultCode());
      }
    }
  }

  public static class DeliveryReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
      String id = intent.getStringExtra("messageId");
      String to = intent.getStringExtra("to");
      SmsBridgeModule.emitDelivery(id, to, "delivered", null);
    }
  }
}
