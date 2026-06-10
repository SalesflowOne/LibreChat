const { logger } = require('@librechat/data-schemas');
const { listTenantAgentRuns } = require('@librechat/api');
const { listAgentRuns, getAgentRunById } = require('~/models');

const getTenantIdFromUser = (user) => user.tenantId?.trim();

const listRunsController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }
    const runs = await listTenantAgentRuns({ listAgentRuns }, tenantId, { limit: 50 });
    return res.status(200).json({ runs });
  } catch (error) {
    logger.error('[AgentOps] list runs failed', error);
    return res.status(500).json({ message: 'Failed to list runs' });
  }
};

const getRunController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    const run = await getAgentRunById(req.params.runId);
    if (!run || run.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Run not found' });
    }
    return res.status(200).json({ run });
  } catch (error) {
    logger.error('[AgentOps] get run failed', error);
    return res.status(500).json({ message: 'Failed to get run' });
  }
};

module.exports = {
  listRunsController,
  getRunController,
};
