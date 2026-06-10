const { Router } = require('express');
const { PermissionTypes, Permissions } = require('librechat-data-provider');
const { generateCheckAccess } = require('@librechat/api');
const {
  getPipedreamStatusController,
  getPipedreamAccountsController,
  createPipedreamConnectTokenController,
} = require('~/server/controllers/pipedream');
const { requireJwtAuth } = require('~/server/middleware');
const db = require('~/models');

const router = Router();

const checkMCPUsePermissions = generateCheckAccess({
  permissionType: PermissionTypes.MCP_SERVERS,
  permissions: [Permissions.USE],
  getRoleByName: db.getRoleByName,
});

router.get('/status', requireJwtAuth, checkMCPUsePermissions, getPipedreamStatusController);
router.get('/accounts', requireJwtAuth, checkMCPUsePermissions, getPipedreamAccountsController);
router.post(
  '/connect-token',
  requireJwtAuth,
  checkMCPUsePermissions,
  createPipedreamConnectTokenController,
);

module.exports = router;
