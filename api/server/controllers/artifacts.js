const { logger } = require('@librechat/data-schemas');
const {
  createPersistedArtifact,
  listTenantArtifacts,
  getTenantArtifact,
  buildArtifactPreviewHtml,
} = require('@librechat/api');
const {
  createArtifact,
  listArtifacts,
  getArtifactById,
  updateArtifact,
} = require('~/models');

const getTenantIdFromUser = (user) => user.tenantId?.trim();

const listArtifactsController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }
    const artifacts = await listTenantArtifacts({ listArtifacts }, tenantId, { limit: 50 });
    return res.status(200).json({ artifacts });
  } catch (error) {
    logger.error('[Artifacts] list failed', error);
    return res.status(500).json({ message: 'Failed to list artifacts' });
  }
};

const createArtifactController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }

    const { title, type, files, conversationId, messageId } = req.body ?? {};
    if (!title || !type || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'title, type, and files are required' });
    }

    const artifact = await createPersistedArtifact(
      { createArtifact },
      {
        userId: req.user.id,
        tenantId,
        title,
        type,
        files,
        conversationId,
        messageId,
      },
    );

    return res.status(201).json({ artifact });
  } catch (error) {
    logger.error('[Artifacts] create failed', error);
    return res.status(500).json({ message: 'Failed to create artifact' });
  }
};

const getArtifactController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }

    const artifact = await getTenantArtifact({ getArtifactById }, tenantId, req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }
    return res.status(200).json({ artifact });
  } catch (error) {
    logger.error('[Artifacts] get failed', error);
    return res.status(500).json({ message: 'Failed to get artifact' });
  }
};

const previewArtifactController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }

    const artifact = await getTenantArtifact({ getArtifactById }, tenantId, req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }

    const html = buildArtifactPreviewHtml(artifact.files ?? []);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    logger.error('[Artifacts] preview failed', error);
    return res.status(500).json({ message: 'Failed to render preview' });
  }
};

const publishArtifactPreviewController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }

    const artifact = await getTenantArtifact({ getArtifactById }, tenantId, req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }

    const previewPath = `/api/artifacts/${artifact.artifactId}/preview`;
    const domainClient = (process.env.DOMAIN_CLIENT || 'http://localhost:3090').replace(/\/$/, '');
    const previewUrl = `${domainClient}${previewPath}`;

    const updated = await updateArtifact(artifact.artifactId, {
      status: 'preview',
      previewUrl,
    });

    return res.status(200).json({ artifact: updated, previewUrl });
  } catch (error) {
    logger.error('[Artifacts] publish preview failed', error);
    return res.status(500).json({ message: 'Failed to publish preview' });
  }
};

module.exports = {
  listArtifactsController,
  createArtifactController,
  getArtifactController,
  previewArtifactController,
  publishArtifactPreviewController,
};
