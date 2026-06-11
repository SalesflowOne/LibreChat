import type { PipedreamAppConfig, PipedreamRuntimeConfig } from './config';
import { listPipedreamCatalogApps } from './client';

function filterConfiguredApps(apps: PipedreamAppConfig[], q?: string): PipedreamAppConfig[] {
  const query = q?.trim().toLowerCase();
  if (!query) {
    return apps;
  }

  return apps.filter(
    (app) =>
      app.name.toLowerCase().includes(query) || app.slug.toLowerCase().replace(/_/g, ' ').includes(query),
  );
}

export async function resolvePipedreamApps(
  runtime: PipedreamRuntimeConfig,
  options?: { q?: string; limit?: number },
): Promise<PipedreamAppConfig[]> {
  if (runtime.apps.length > 0) {
    return filterConfiguredApps(runtime.apps, options?.q);
  }

  const catalog = await listPipedreamCatalogApps({
    environment: runtime.environment,
    q: options?.q,
    limit: options?.limit,
  });

  return catalog.apps;
}
