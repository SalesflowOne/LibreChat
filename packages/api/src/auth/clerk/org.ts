import { logger } from '@librechat/data-schemas';
import type { ClerkTokenClaims } from './types';

type ClerkMembershipList = {
  data?: Array<{
    organization?: {
      id?: string;
    };
  }>;
};

export async function resolveClerkOrganizationId(
  claims: ClerkTokenClaims,
): Promise<string | null> {
  const claimOrgId = claims.org_id?.trim();
  if (claimOrgId) {
    return claimOrgId;
  }

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey || !claims.sub) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.clerk.com/v1/users/${encodeURIComponent(claims.sub)}/organization_memberships?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    if (!response.ok) {
      logger.warn('[Clerk] Failed to list organization memberships', {
        status: response.status,
        userId: claims.sub,
      });
      return null;
    }

    const body = (await response.json()) as ClerkMembershipList;
    const membershipOrgId = body.data?.find((entry) => entry.organization?.id)?.organization?.id;
    return membershipOrgId?.trim() ?? null;
  } catch (error) {
    logger.warn('[Clerk] Organization lookup failed', error);
    return null;
  }
}
