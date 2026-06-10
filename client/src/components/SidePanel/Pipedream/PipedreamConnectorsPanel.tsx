import { useState } from 'react';
import { PlugZap } from 'lucide-react';
import { Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  usePipedreamAccountsQuery,
  usePipedreamStatusQuery,
} from '~/data-provider/Pipedream';
import PipedreamConnectorCard from './PipedreamConnectorCard';

export default function PipedreamConnectorsPanel() {
  const localize = useLocalize();
  const [connectingAppSlug, setConnectingAppSlug] = useState<string | null>(null);

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

  if (!status?.enabled || status.apps.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-text-secondary">
        {localize('com_ui_pipedream_not_configured')}
      </div>
    );
  }

  const accounts = accountsData?.accounts ?? [];

  return (
    <div className="flex h-auto w-full flex-col px-3 pb-3 pt-2">
      <div role="region" aria-label={localize('com_ui_pipedream_connectors')} className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg border border-border-light bg-surface-secondary p-3">
          <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          <p className="text-xs text-text-secondary">{localize('com_ui_pipedream_panel_help')}</p>
        </div>

        {isAccountsLoading ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-5 w-5" />
          </div>
        ) : (
          <div className="space-y-2" role="list">
            {status.apps.map((app) => (
              <PipedreamConnectorCard
                key={app.slug}
                app={app}
                accounts={accounts}
                isConnecting={connectingAppSlug !== null}
                connectingAppSlug={connectingAppSlug}
                onConnectStart={setConnectingAppSlug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
