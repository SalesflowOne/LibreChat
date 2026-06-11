import AgentOpsPage from '~/components/AgentOps/Page';
import ArtifactGalleryPanel from '~/components/AgentOps/ArtifactGalleryPanel';

export default function AgentOpsArtifacts() {
  return (
    <AgentOpsPage maxWidthClass="max-w-4xl">
      <ArtifactGalleryPanel />
    </AgentOpsPage>
  );
}
