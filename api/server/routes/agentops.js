const { Router } = require('express');
const { listRunsController, getRunController } = require('~/server/controllers/agentops');
const { requireJwtAuth } = require('~/server/middleware');

const router = Router();

router.use(requireJwtAuth);

router.get('/runs', listRunsController);
router.get('/runs/:runId', getRunController);

module.exports = router;
