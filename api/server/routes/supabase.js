const express = require('express');
const { supabaseExchangeController } = require('~/server/controllers/supabase');

const router = express.Router();

router.post('/exchange', supabaseExchangeController);

module.exports = router;
