import * as SMS from 'expo-sms';
import type { SmsProvider, SmsSendResult } from '../SmsProvider';

export class ExpoSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<SmsSendResult> {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      return { to, status: 'failed', error: 'SMS is not available on this device' };
    }
    // iOS/Android will open the system composer; user action is required
    const { result } = await SMS.sendSMSAsync([to], message);
    if (result === 'sent') return { to, status: 'sent' };
    if (result === 'cancelled') return { to, status: 'cancelled' };
    return { to, status: 'unknown' };
  }
}
