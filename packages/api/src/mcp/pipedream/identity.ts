import type { IUser } from '@librechat/data-schemas';

/** Pipedream Connect external user id scoped to org + user. */
export function getPipedreamExternalUserId(user: Pick<IUser, 'id' | 'tenantId'>): string {
  const userId = user.id?.trim();
  const tenantId = user.tenantId?.trim();
  if (tenantId && userId) {
    return `${tenantId}:${userId}`;
  }
  return userId ?? '';
}
