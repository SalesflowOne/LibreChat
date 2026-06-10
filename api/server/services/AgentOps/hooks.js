const { logger } = require('@librechat/data-schemas');
const {
  startAgentRun,
  recordAgentToolStep,
  persistCodeExecutionArtifact,
  isPersistableCodeFile,
} = require('@librechat/api');
const { createAgentRun, createArtifact, appendAgentRunStep, completeAgentRun } = require('~/models');

const agentOpsStore = {
  createAgentRun,
  createArtifact,
  appendAgentRunStep,
  completeAgentRun,
};

function getTenantId(user) {
  return user?.tenantId?.trim();
}

async function ensureAgentRunForRequest(req, metadata) {
  if (req._agentOpsRunId) {
    return req._agentOpsRunId;
  }

  const tenantId = getTenantId(req.user);
  if (!tenantId) {
    return null;
  }

  try {
    const run = await startAgentRun(agentOpsStore, {
      userId: req.user.id,
      tenantId,
      conversationId: metadata?.thread_id,
      agentId: metadata?.agent_id,
      prompt: req.body?.text,
    });
    req._agentOpsRunId = run.runId;
    return run.runId;
  } catch (error) {
    logger.warn('[AgentOps] Failed to start agent run', error);
    return null;
  }
}

async function handleAgentOpsCodeFile({ req, metadata, output, fileMetadata, file }) {
  const tenantId = getTenantId(req.user);
  if (!tenantId || !file?.name || file.inherited) {
    return;
  }

  if (!isPersistableCodeFile(file.name)) {
    return;
  }

  const runId = await ensureAgentRunForRequest(req, metadata);
  if (runId) {
    await recordAgentToolStep(agentOpsStore, runId, output.name, 'started');
  }

  let content = file.content;
  if (!content && fileMetadata?.text) {
    content = fileMetadata.text;
  }

  if (!content?.trim()) {
    return;
  }

  await persistCodeExecutionArtifact(agentOpsStore, {
    userId: req.user.id,
    tenantId,
    conversationId: metadata.thread_id,
    messageId: metadata.run_id,
    runId: runId ?? undefined,
    toolName: output.name,
    title: file.name,
    files: [{ name: file.name, content }],
  });
}

module.exports = {
  ensureAgentRunForRequest,
  handleAgentOpsCodeFile,
};
