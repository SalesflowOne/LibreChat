import { ExternalLink, Rocket } from 'lucide-react';
import { Spinner, Button } from '@librechat/client';
import { useLocalize } from '~/hooks';
import {
  useArtifactsQuery,
  useDeploySpaceMutation,
  usePublishArtifactPreviewMutation,
} from '~/data-provider/AgentOps';

export default function ArtifactGalleryPanel() {
  const localize = useLocalize();
  const { data, isLoading } = useArtifactsQuery();
  const publishPreview = usePublishArtifactPreviewMutation();
  const deploySpace = useDeploySpaceMutation();

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const artifacts = data?.artifacts ?? [];

  return (
    <div className="flex h-auto w-full flex-col gap-3 px-3 pb-3 pt-2">
      {artifacts.length === 0 ? (
        <p className="px-1 text-sm text-text-secondary">{localize('com_ui_agentops_no_artifacts')}</p>
      ) : (
        artifacts.map((artifact) => (
          <article
            key={artifact.artifactId}
            className="rounded-xl border border-border-light bg-surface-secondary p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-text-primary">{artifact.title}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-text-secondary">
                  {artifact.type} · {artifact.status}
                </p>
              </div>
              {artifact.previewUrl && (
                <a
                  href={artifact.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-text-secondary hover:text-text-primary"
                  aria-label={localize('com_ui_agentops_open_preview')}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={publishPreview.isLoading}
                onClick={() => publishPreview.mutate(artifact.artifactId)}
              >
                {localize('com_ui_agentops_preview')}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deploySpace.isLoading}
                onClick={() =>
                  deploySpace.mutate({
                    artifactId: artifact.artifactId,
                    name: artifact.title,
                  })
                }
              >
                <Rocket className="mr-1 h-3.5 w-3.5" />
                {localize('com_ui_agentops_deploy')}
              </Button>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
