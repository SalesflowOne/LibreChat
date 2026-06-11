import { logger } from '@librechat/data-schemas';
import type { SupabaseUserClaims } from './types';

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  role?: string;
};

export function isSupabaseAuthEnabled(): boolean {
  return process.env.SUPABASE_AUTH_ENABLED === 'true';
}

function resolveSupabaseUrl(): string | null {
  return process.env.SUPABASE_URL?.trim() || null;
}

function resolveSupabaseServiceKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export async function verifySupabaseAccessToken(
  accessToken: string,
): Promise<SupabaseUserClaims | null> {
  const supabaseUrl = resolveSupabaseUrl();
  const serviceKey = resolveSupabaseServiceKey();

  if (!supabaseUrl || !serviceKey) {
    logger.error('[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured');
    return null;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: serviceKey,
      },
    });

    if (!response.ok) {
      logger.warn('[Supabase] Token verification failed', { status: response.status });
      return null;
    }

    const user = (await response.json()) as SupabaseUserResponse;
    if (!user.id) {
      return null;
    }

    return {
      sub: user.id,
      email: typeof user.email === 'string' ? user.email : undefined,
      role: typeof user.role === 'string' ? user.role : undefined,
    };
  } catch (error) {
    logger.warn('[Supabase] Token verification error', error);
    return null;
  }
}
