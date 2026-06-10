import crypto from 'crypto';

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function verifyClerkWebhookSignature(
  payload: string | Buffer,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): boolean {
  const webhookSecret = secret.trim();
  if (!webhookSecret) {
    return false;
  }

  const svixId = getHeader(headers, 'svix-id');
  const svixTimestamp = getHeader(headers, 'svix-timestamp');
  const svixSignature = getHeader(headers, 'svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  const timestamp = Number(svixTimestamp);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSeconds > 300) {
    return false;
  }

  const signedContent = `${svixId}.${svixTimestamp}.${payload.toString()}`;
  const secretBytes = webhookSecret.startsWith('whsec_')
    ? Buffer.from(webhookSecret.slice(6), 'base64')
    : Buffer.from(webhookSecret, 'utf8');

  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  const signatures = svixSignature.split(' ');
  return signatures.some((entry) => {
    const [version, signature] = entry.split(',');
    if (version !== 'v1' || !signature) {
      return false;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}
