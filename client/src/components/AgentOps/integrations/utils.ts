import type { PipedreamAccount, PipedreamApp } from 'librechat-data-provider';

export function getActiveAccountsForApp(
  accounts: PipedreamAccount[],
  appSlug: string,
): PipedreamAccount[] {
  return accounts.filter((account) => account.appSlug === appSlug && !account.dead);
}

export function getConnectedAppSlugs(accounts: PipedreamAccount[]): Set<string> {
  const slugs = new Set<string>();
  for (const account of accounts) {
    if (!account.dead) {
      slugs.add(account.appSlug);
    }
  }
  return slugs;
}

export function filterAppsByQuery(apps: PipedreamApp[], query: string): PipedreamApp[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return apps;
  }

  return apps.filter((app) => {
    const haystack = `${app.name} ${app.slug} ${app.description ?? ''}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
