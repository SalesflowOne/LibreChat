const { logger } = require('@librechat/data-schemas');
const { deployArtifactAsSpace } = require('@librechat/api');
const {
  createSpace,
  listSpaces,
  getSpaceById,
  getArtifactById,
  updateSpace,
} = require('~/models');

const getTenantIdFromUser = (user) => user.tenantId?.trim();

const listSpacesController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }
    const spaces = await listSpaces({ tenantId }, { limit: 50 });
    return res.status(200).json({ spaces });
  } catch (error) {
    logger.error('[Spaces] list failed', error);
    return res.status(500).json({ message: 'Failed to list spaces' });
  }
};

const deploySpaceController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context is required' });
    }

    const { artifactId, name } = req.body ?? {};
    if (!artifactId) {
      return res.status(400).json({ message: 'artifactId is required' });
    }

    const artifact = await getArtifactById(artifactId);
    if (!artifact || artifact.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Artifact not found' });
    }

    const result = await deployArtifactAsSpace(
      { createSpace, updateSpace },
      {
        userId: req.user.id,
        tenantId,
        artifact,
        name,
      },
    );

    return res.status(201).json(result);
  } catch (error) {
    logger.error('[Spaces] deploy failed', error);
    return res.status(500).json({ message: 'Failed to deploy space' });
    }
};

const getSpaceController = async (req, res) => {
  try {
    const tenantId = getTenantIdFromUser(req.user);
    const space = await getSpaceById(req.params.spaceId);
    if (!space || space.tenantId !== tenantId) {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(200).json({ space });
  } catch (error) {
    logger.error('[Spaces] get failed', error);
    return res.status(500).json({ message: 'Failed to get space' });
  }
};

module.exports = {
  listSpacesController,
  deploySpaceController,
  getSpaceController,
};
