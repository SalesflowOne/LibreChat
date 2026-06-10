import agentRunSchema from '~/schema/agentRun';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import type { IAgentRun } from '~/types/agentRun';

export function createAgentRunModel(mongoose: typeof import('mongoose')) {
  applyTenantIsolation(agentRunSchema);
  return mongoose.models.AgentRun || mongoose.model<IAgentRun>('AgentRun', agentRunSchema);
}
