import ArtifactGalleryPanel from '~/components/AgentOps/ArtifactGalleryPanel';

export default function AgentOpsArtifacts() {
  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto p-6">
      <ArtifactGalleryPanel />
    </div>
  );
}
