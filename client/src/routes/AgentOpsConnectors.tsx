import ConnectorHubPanel from '~/components/AgentOps/ConnectorHubPanel';

export default function AgentOpsConnectors() {
  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto p-6">
      <ConnectorHubPanel />
    </div>
  );
}
