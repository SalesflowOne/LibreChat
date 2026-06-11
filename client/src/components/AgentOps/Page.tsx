import type { ReactNode } from 'react';

export const AGENT_OPS_STATS_GRID = 'grid grid-cols-agentops-stats gap-4';

export const AGENT_OPS_PANELS_GRID = 'grid grid-cols-agentops-panels gap-4';

export const AGENT_OPS_CARDS_GRID = 'grid grid-cols-agentops-cards gap-4';

export default function AgentOpsPage({
  children,
  maxWidthClass = 'max-w-6xl',
}: {
  children: ReactNode;
  maxWidthClass?: string;
}) {
  return (
    <div className="flex h-full min-w-0 w-full flex-1 overflow-y-auto bg-surface-primary">
      <div className={`flex w-full min-w-0 flex-col gap-6 p-4 sm:p-6 ${maxWidthClass}`}>
        {children}
      </div>
    </div>
  );
}
