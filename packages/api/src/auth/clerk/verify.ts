import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from '@librechat/data-schemas';
import type { ClerkTokenClaims } from './types';

let jwks: ReturnType<typeof jwksClient> | null = null;

function getJwksClient() {
  const jwksUrl = process.env.JWKS_URL?.trim() || process.env.CLERK_JWKS_URL?.trim();
  if (!jwksUrl) {
    return null;
  }
  if (!jwks) {
    jwks = jwksClient({
      jwksUri: jwksUrl,
      cache: true,
      rateLimit: true,
    });
  }
  return jwks;
}

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  const client = getJwksClient();
  if (!client || !header.kid) {
    callback(new Error('JWKS is not configured'));
    return;
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err ?? new Error('Signing key not found'));
      return;
    }
    callback(null, key.getPublicKey());
  });
}

export function isClerkAuthEnabled(): boolean {
  return process.env.CLERK_AUTH_ENABLED === 'true' || process.env.CLERK_ONLY_AUTH === 'true';
}

export async function verifyClerkToken(token: string): Promise<ClerkTokenClaims | null> {
  const client = getJwksClient();
  if (!client) {
    logger.error('[Clerk] JWKS_URL is not configured');
    return null;
  }

  return new Promise((resolve) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err || !decoded || typeof decoded !== 'object') {
          logger.warn('[Clerk] Token verification failed', err);
          resolve(null);
          return;
        }
        const claims = decoded as jwt.JwtPayload & ClerkTokenClaims;
        if (!claims.sub) {
          resolve(null);
          return;
        }
        resolve({
          sub: claims.sub,
          org_id: typeof claims.org_id === 'string' ? claims.org_id : undefined,
          org_role: typeof claims.org_role === 'string' ? claims.org_role : undefined,
          email: typeof claims.email === 'string' ? claims.email : undefined,
          name: typeof claims.name === 'string' ? claims.name : undefined,
          image_url: typeof claims.image_url === 'string' ? claims.image_url : undefined,
        });
      },
    );
  });
}
