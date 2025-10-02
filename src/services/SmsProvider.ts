export type SmsSendStatus = 'sent' | 'cancelled' | 'unknown' | 'failed';
export type SmsSendResult = { to: string; status: SmsSendStatus; error?: string };

export interface SmsProvider {
  send(to: string, message: string): Promise<SmsSendResult>;
}
