import { ExternalLink } from 'lucide-react';
import { Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { useSpacesQuery } from '~/data-provider/AgentOps';

export default function SpacesPanel() {
  const localize = useLocalize();
  const { data, isLoading } = useSpacesQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const spaces = data?.spaces ?? [];

  return (
    <div className="flex h-auto w-full flex-col gap-3 px-3 pb-3 pt-2">
      {spaces.length === 0 ? (
        <p className="px-1 text-sm text-text-secondary">{localize('com_ui_agentops_no_spaces')}</p>
      ) : (
        spaces.map((space) => (
          <article
            key={space.spaceId}
            className="rounded-xl border border-border-light bg-surface-secondary p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-text-primary">{space.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-text-secondary">
                  {space.provider} · {space.status}
                </p>
              </div>
              {space.url && (
                <a
                  href={space.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                  aria-label={localize('com_ui_agentops_open_space')}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
