import type { ReactNode } from 'react';

export const AGENT_OPS_STATS_GRID =
  'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))]';

export const AGENT_OPS_PANELS_GRID =
  'grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]';

export const AGENT_OPS_CARDS_GRID =
  'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]';

export default function AgentOpsPage({
  children,
  maxWidthClass = 'max-w-6xl',
}: {
  children: ReactNode;
  maxWidthClass?: string;
}) {
  return (
    <div className="flex h-full min-w-0 w-full flex-1 overflow-y-auto">
      <div className={`mx-auto flex w-full min-w-0 flex-col gap-6 p-6 ${maxWidthClass}`}>
        {children}
      </div>
    </div>
  );
}
