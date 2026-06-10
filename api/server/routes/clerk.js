const express = require('express');
const { clerkExchangeController, clerkWebhookController } = require('~/server/controllers/clerk');

const router = express.Router();

router.post('/exchange', clerkExchangeController);
router.post('/webhook', express.raw({ type: 'application/json' }), clerkWebhookController);

module.exports = router;
