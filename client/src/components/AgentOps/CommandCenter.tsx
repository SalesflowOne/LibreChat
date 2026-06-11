import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, LayoutDashboard, PlugZap, Rocket } from 'lucide-react';
import { Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  useArtifactsQuery,
  useSpacesQuery,
  useAgentRunsQuery,
} from '~/data-provider/AgentOps';
import { usePipedreamStatusQuery } from '~/data-provider/Pipedream';
import AgentOpsPage, { AGENT_OPS_PANELS_GRID, AGENT_OPS_STATS_GRID } from './Page';

export default function CommandCenter() {
  const localize = useLocalize();
  const { data: artifacts, isLoading: artifactsLoading } = useArtifactsQuery();
  const { data: spaces, isLoading: spacesLoading } = useSpacesQuery();
  const { data: runs, isLoading: runsLoading } = useAgentRunsQuery();
  const { data: pipedream } = usePipedreamStatusQuery();

  const isLoading = artifactsLoading || spacesLoading || runsLoading;

  return (
    <AgentOpsPage>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
          {localize('com_ui_agentops_label')}
        </p>
        <h1 className="text-3xl font-semibold text-text-primary">
          {localize('com_ui_agentops_command_center')}
        </h1>
        <p className="max-w-2xl text-sm text-text-secondary">
          {localize('com_ui_agentops_command_center_desc')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className={AGENT_OPS_STATS_GRID}>
          <StatCard
            icon={PlugZap}
            title={localize('com_ui_agentops_connectors')}
            value={String(pipedream?.apps?.length ?? 0)}
            hint={localize('com_ui_agentops_connectors_hint')}
            to="/connectors"
          />
          <StatCard
            icon={Boxes}
            title={localize('com_ui_agentops_artifacts')}
            value={String(artifacts?.artifacts.length ?? 0)}
            hint={localize('com_ui_agentops_artifacts_hint')}
            to="/artifacts"
          />
          <StatCard
            icon={Rocket}
            title={localize('com_ui_agentops_spaces')}
            value={String(spaces?.spaces.length ?? 0)}
            hint={localize('com_ui_agentops_spaces_hint')}
            to="/spaces"
          />
          <StatCard
            icon={LayoutDashboard}
            title={localize('com_ui_agentops_runs')}
            value={String(runs?.runs.length ?? 0)}
            hint={localize('com_ui_agentops_runs_hint')}
            to="/home"
          />
        </div>
      )}

      <div className={AGENT_OPS_PANELS_GRID}>
        <section className="rounded-2xl border border-border-light bg-surface-primary p-5">
          <h2 className="text-lg font-medium text-text-primary">
            {localize('com_ui_agentops_quick_actions')}
          </h2>
          <div className="mt-4 space-y-3">
            <QuickAction
              title={localize('com_ui_agentops_action_connect')}
              description={localize('com_ui_agentops_action_connect_desc')}
              to="/connectors"
            />
            <QuickAction
              title={localize('com_ui_agentops_action_build')}
              description={localize('com_ui_agentops_action_build_desc')}
              to="/c/new"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border-light bg-surface-primary p-5">
          <h2 className="text-lg font-medium text-text-primary">
            {localize('com_ui_agentops_recent_artifacts')}
          </h2>
          <ul className="mt-4 space-y-2">
            {(artifacts?.artifacts ?? []).slice(0, 5).map((artifact) => (
              <li
                key={artifact.artifactId}
                className="flex items-center justify-between rounded-lg border border-border-light px-3 py-2 text-sm"
              >
                <span className="truncate text-text-primary">{artifact.title}</span>
                <span className="ml-3 shrink-0 text-xs uppercase text-text-secondary">
                  {artifact.status}
                </span>
              </li>
            ))}
            {(artifacts?.artifacts.length ?? 0) === 0 && (
              <li className="text-sm text-text-secondary">
                {localize('com_ui_agentops_no_artifacts')}
              </li>
            )}
          </ul>
        </section>
      </div>
    </AgentOpsPage>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  hint,
  to,
}: {
  icon: typeof PlugZap;
  title: string;
  value: string;
  hint: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group min-w-0 rounded-2xl border border-border-light bg-surface-primary p-5 transition hover:border-border-medium hover:bg-surface-secondary"
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        <ArrowRight className="h-4 w-4 text-text-secondary opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary">{hint}</p>
    </Link>
  );
}

function QuickAction({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start justify-between rounded-xl border border-border-light px-4 py-3 transition hover:bg-surface-secondary"
    >
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="mt-1 text-xs text-text-secondary">{description}</p>
      </div>
      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
    </Link>
  );
}
