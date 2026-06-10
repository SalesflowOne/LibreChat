import { SystemRoles } from 'librechat-data-provider';
import { logger } from '@librechat/data-schemas';
import type { IUser } from '@librechat/data-schemas';
import type { ClerkExchangeResult, ClerkTokenClaims } from './types';
import { verifyClerkToken } from './verify';

export interface ClerkUserStore {
  findUser: (filter: Record<string, string>) => Promise<IUser | null>;
  createUser: (data: Record<string, unknown>) => Promise<IUser>;
  updateUser: (userId: string, data: Record<string, unknown>) => Promise<IUser | null>;
}

export interface ClerkTokenIssuer {
  issueTokens: (user: IUser) => Promise<{ token: string; refreshToken: string }>;
}

function resolveEmail(claims: ClerkTokenClaims): string {
  if (claims.email?.trim()) {
    return claims.email.trim().toLowerCase();
  }
  return `${claims.sub}@clerk.artemiis.one`;
}

function resolveName(claims: ClerkTokenClaims, email: string): string {
  if (claims.name?.trim()) {
    return claims.name.trim();
  }
  return email.split('@')[0] ?? 'Operator';
}

export async function exchangeClerkSession({
  clerkToken,
  userStore,
  tokenIssuer,
}: {
  clerkToken: string;
  userStore: ClerkUserStore;
  tokenIssuer: ClerkTokenIssuer;
}): Promise<ClerkExchangeResult | null> {
  const claims = await verifyClerkToken(clerkToken);
  if (!claims) {
    return null;
  }

  const email = resolveEmail(claims);
  const tenantId = claims.org_id?.trim();

  if (!tenantId) {
    logger.warn('[Clerk] Exchange rejected: user has no active organization');
    return null;
  }

  let user =
    (await userStore.findUser({ clerkId: claims.sub })) ??
    (await userStore.findUser({ email }));

  if (!user) {
    user = await userStore.createUser({
      email,
      name: resolveName(claims, email),
      provider: 'clerk',
      emailVerified: true,
      avatar: claims.image_url,
      clerkId: claims.sub,
      tenantId,
      role: SystemRoles.USER,
    });
  } else if (user.tenantId !== tenantId || user.clerkId !== claims.sub) {
    user =
      (await userStore.updateUser(String(user._id ?? user.id), {
        clerkId: claims.sub,
        tenantId,
        provider: 'clerk',
        emailVerified: true,
        avatar: claims.image_url ?? user.avatar,
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
