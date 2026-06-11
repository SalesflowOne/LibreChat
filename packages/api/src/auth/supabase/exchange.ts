import { SystemRoles } from 'librechat-data-provider';
import { logger } from '@librechat/data-schemas';
import type { IUser } from '@librechat/data-schemas';
import type { SupabaseExchangeResult, SupabaseUserClaims } from './types';
import { verifySupabaseAccessToken } from './verify';

export interface SupabaseUserStore {
  findUser: (filter: Record<string, string>) => Promise<IUser | null>;
  createUser: (data: Record<string, unknown>) => Promise<IUser>;
  updateUser: (userId: string, data: Record<string, unknown>) => Promise<IUser | null>;
}

export interface SupabaseTokenIssuer {
  issueTokens: (user: IUser) => Promise<{ token: string; refreshToken: string }>;
}

function resolveEmail(claims: SupabaseUserClaims): string {
  if (claims.email?.trim()) {
    return claims.email.trim().toLowerCase();
  }
  return `${claims.sub}@users.supabase.local`;
}

function resolveName(claims: SupabaseUserClaims, email: string): string {
  const localPart = email.split('@')[0];
  return localPart || 'User';
}

export async function exchangeSupabaseSession({
  accessToken,
  userStore,
  tokenIssuer,
}: {
  accessToken: string;
  userStore: SupabaseUserStore;
  tokenIssuer: SupabaseTokenIssuer;
}): Promise<SupabaseExchangeResult | null> {
  const claims = await verifySupabaseAccessToken(accessToken);
  if (!claims) {
    return null;
  }

  const email = resolveEmail(claims);
  const tenantId = claims.sub;

  let user =
    (await userStore.findUser({ supabaseId: claims.sub })) ??
    (await userStore.findUser({ email }));

  if (!user) {
    user = await userStore.createUser({
      email,
      name: resolveName(claims, email),
      provider: 'supabase',
      emailVerified: true,
      supabaseId: claims.sub,
      tenantId,
      role: SystemRoles.USER,
    });
  } else if (user.supabaseId !== claims.sub || user.tenantId !== tenantId) {
    user =
      (await userStore.updateUser(String(user._id ?? user.id), {
        supabaseId: claims.sub,
        tenantId,
        provider: 'supabase',
        emailVerified: true,
        name: user.name ?? resolveName(claims, email),
      })) ?? user;
  }

  const tokens = await tokenIssuer.issueTokens(user);
  const userId = String(user._id ?? user.id);

  return {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: {
      id: userId,
      email: user.email,
      name: user.name ?? resolveName(claims, email),
      role: user.role ?? SystemRoles.USER,
      tenantId,
    },
  };
}
