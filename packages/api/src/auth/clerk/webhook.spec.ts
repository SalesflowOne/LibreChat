import crypto from 'crypto';
import { verifyClerkWebhookSignature } from './webhook';

function signPayload(payload: string, secret: string, timestamp: string, id: string): string {
  const secretBytes = Buffer.from(secret.slice(6), 'base64');
  const signedContent = `${id}.${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  return `v1,${signature}`;
}

describe('verifyClerkWebhookSignature', () => {
  const secret = `whsec_${Buffer.from('test-secret-key-32bytes-long!!').toString('base64')}`;

  it('accepts valid svix signatures', () => {
    const payload = JSON.stringify({ type: 'user.created', data: { id: 'user_1' } });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const id = 'msg_123';
    const signature = signPayload(payload, secret, timestamp, id);

    expect(
      verifyClerkWebhookSignature(payload, {
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': signature,
      }, secret),
    ).toBe(true);
  });

  it('rejects invalid signatures', () => {
    const payload = JSON.stringify({ type: 'user.created', data: { id: 'user_1' } });
    expect(
      verifyClerkWebhookSignature(payload, {
        'svix-id': 'msg_123',
        'svix-timestamp': String(Math.floor(Date.now() / 1000)),
        'svix-signature': 'v1,invalid',
      }, secret),
    ).toBe(false);
  });
});
