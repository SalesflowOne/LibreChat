import { Link } from 'react-router-dom';
import { ArrowRight, PlugZap } from 'lucide-react';
import { Button, Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  usePipedreamAccountsQuery,
  usePipedreamStatusQuery,
} from '~/data-provider/Pipedream';
import IntegrationCard from './integrations/IntegrationCard';

export default function ConnectorHubPanel() {
  const localize = useLocalize();
  const { data: status, isLoading: isStatusLoading } = usePipedreamStatusQuery();
  const { data: accountsData, isLoading: isAccountsLoading } = usePipedreamAccountsQuery(
    Boolean(status?.enabled),
  );

  if (isStatusLoading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const accounts = accountsData?.accounts ?? [];
  const apps = status?.apps ?? [];
  const connectedApps = apps.filter((app) =>
    accounts.some((account) => account.appSlug === app.slug && !account.dead),
  );
  const previewApps = (connectedApps.length > 0 ? connectedApps : apps).slice(0, 3);

  return (
    <div className="flex h-auto w-full flex-col px-3 pb-3 pt-2">
      <div role="region" aria-label={localize('com_ui_agentops_connectors')} className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg border border-border-light bg-surface-secondary p-3">
          <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <p className="text-xs text-text-secondary">{localize('com_ui_integrations_sidebar_help')}</p>
        </div>

        {!status?.enabled || apps.length === 0 ? (
          <p className="px-1 text-sm text-text-secondary">
            {localize('com_ui_integrations_not_configured_desc')}
          </p>
        ) : isAccountsLoading ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-5 w-5" />
          </div>
        ) : (
          <div className="space-y-2" role="list">
            {previewApps.map((app) => (
              <IntegrationCard key={app.slug} app={app} accounts={accounts} />
            ))}
          </div>
        )}

        <Button asChild type="button" variant="outline" className="w-full">
          <Link to="/connectors">
            {localize('com_ui_integrations_view_all')}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
