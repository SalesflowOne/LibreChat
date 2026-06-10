const { Router } = require('express');
const {
  listSpacesController,
  deploySpaceController,
  getSpaceController,
} = require('~/server/controllers/spaces');
const { requireJwtAuth } = require('~/server/middleware');

const router = Router();

router.use(requireJwtAuth);

router.get('/', listSpacesController);
router.post('/deploy', deploySpaceController);
router.get('/:spaceId', getSpaceController);

module.exports = router;
