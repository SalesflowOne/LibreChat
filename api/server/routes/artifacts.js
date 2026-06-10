const { Router } = require('express');
const {
  listArtifactsController,
  createArtifactController,
  getArtifactController,
  previewArtifactController,
  publishArtifactPreviewController,
} = require('~/server/controllers/artifacts');
const { requireJwtAuth } = require('~/server/middleware');

const router = Router();

router.use(requireJwtAuth);

router.get('/', listArtifactsController);
router.post('/', createArtifactController);
router.get('/:artifactId', getArtifactController);
router.get('/:artifactId/preview', previewArtifactController);
router.post('/:artifactId/preview', publishArtifactPreviewController);

module.exports = router;
