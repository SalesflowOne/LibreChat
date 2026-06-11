import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  FilterInput,
  OGDialogTrigger,
  Spinner,
  Switch,
} from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useLocalize, useHasAccess } from '~/hooks';
import {
  usePipedreamAccountsQuery,
  usePipedreamStatusQuery,
} from '~/data-provider/Pipedream';
import MCPServerDialog from '~/components/SidePanel/MCPBuilder/MCPServerDialog';
import AgentOpsPage, { AGENT_OPS_CARDS_GRID } from '~/components/AgentOps/Page';
import IntegrationCard from './IntegrationCard';
import { POPULAR_INTEGRATION_SLUGS } from './constants';
import { filterAppsByQuery, getConnectedAppSlugs } from './utils';

type IntegrationTab = 'all' | 'popular';

export default function IntegrationsHub() {
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<IntegrationTab>('all');
  const [connectedOnly, setConnectedOnly] = useState(false);
  const [showMcpDialog, setShowMcpDialog] = useState(false);

  const hasCreateMcpAccess = useHasAccess({
    permissionType: PermissionTypes.MCP_SERVERS,
    permission: Permissions.CREATE,
  });

  const { data: status, isLoading: isStatusLoading } = usePipedreamStatusQuery();
  const { data: accountsData, isLoading: isAccountsLoading } = usePipedreamAccountsQuery(
    Boolean(status?.enabled),
  );

  const accounts = accountsData?.accounts ?? [];
  const apps = status?.apps ?? [];

  const connectedSlugs = useMemo(() => getConnectedAppSlugs(accounts), [accounts]);

  const visibleApps = useMemo(() => {
    let filtered = filterAppsByQuery(apps, searchQuery);

    if (activeTab === 'popular') {
      const popularSet = new Set<string>(POPULAR_INTEGRATION_SLUGS);
      filtered = filtered.filter((app) => popularSet.has(app.slug));
    }

    if (connectedOnly) {
      filtered = filtered.filter((app) => connectedSlugs.has(app.slug));
    }

    return filtered;
  }, [apps, searchQuery, activeTab, connectedOnly, connectedSlugs]);

  const isLoading = isStatusLoading || (status?.enabled && isAccountsLoading);

  return (
    <AgentOpsPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-text-primary">
            {localize('com_ui_integrations_title')}
          </h1>
          <p className="max-w-2xl text-sm text-text-secondary">
            {localize('com_ui_integrations_desc')}
          </p>
        </div>

        {hasCreateMcpAccess && (
          <MCPServerDialog open={showMcpDialog} onOpenChange={setShowMcpDialog}>
            <OGDialogTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                {localize('com_ui_integrations_add_custom_mcp')}
              </Button>
            </OGDialogTrigger>
          </MCPServerDialog>
        )}
      </div>

      <FilterInput
        inputId="integrations-search"
        label={localize('com_ui_integrations_search')}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border-light p-1">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('all')}
          >
            {localize('com_ui_integrations_tab_all')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'popular' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('popular')}
          >
            {localize('com_ui_integrations_tab_popular')}
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <Switch
            checked={connectedOnly}
            onCheckedChange={setConnectedOnly}
            aria-label={localize('com_ui_integrations_connected_only')}
          />
          {localize('com_ui_integrations_connected_only')}
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : !status?.enabled || apps.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-surface-primary p-8 text-center">
          <h2 className="text-lg font-medium text-text-primary">
            {localize('com_ui_integrations_not_configured_title')}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
            {localize('com_ui_integrations_not_configured_desc')}
          </p>
        </div>
      ) : visibleApps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-light p-8 text-center text-sm text-text-secondary">
          {localize('com_ui_integrations_no_results')}
        </div>
      ) : (
        <div className={AGENT_OPS_CARDS_GRID} role="list">
          {visibleApps.map((app) => (
            <IntegrationCard key={app.slug} app={app} accounts={accounts} />
          ))}
        </div>
      )}
    </AgentOpsPage>
  );
}
