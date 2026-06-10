const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const {
  exchangeClerkSession,
  isClerkAuthEnabled,
  verifyClerkWebhookSignature,
} = require('@librechat/api');
const { setAuthTokens } = require('~/server/services/AuthService');
const { findUser, createUser, updateUser, getUserById } = require('~/models');

const sanitizeUserForAuthResponse = (user) => {
  const source = (typeof user?.toObject === 'function' ? user.toObject() : user) || {};
  const {
    password: _pw,
    __v: _v,
    totpSecret: _ts,
    backupCodes: _bc,
    federatedTokens: _ft,
    ...safeUser
  } = source;
  return safeUser;
};

const clerkExchangeController = async (req, res) => {
  try {
    if (!isClerkAuthEnabled()) {
      return res.status(404).json({ message: 'Clerk auth is not enabled' });
    }

    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ message: 'Missing Clerk session token' });
    }

    const result = await exchangeClerkSession({
      clerkToken: token,
      userStore: {
        findUser: async (filter) => findUser(filter),
        createUser: async (data) => {
          const created = await createUser(data, undefined, true, true);
          return created;
        },
        updateUser: async (userId, data) => updateUser(userId, data),
      },
      tokenIssuer: {
        issueTokens: async (user) => {
          const userId = String(user._id ?? user.id);
          const libreToken = await setAuthTokens(userId, res, null, req);
          return {
            token: libreToken,
            refreshToken: '',
          };
        },
      },
    });

    if (!result) {
      return res.status(401).json({ message: 'Invalid Clerk session or missing organization' });
    }

    const dbUser = await getUserById(result.user.id, '-password -__v -totpSecret -backupCodes');
    return res.status(200).json({
      token: result.token,
      user: sanitizeUserForAuthResponse(dbUser ?? result.user),
    });
  } catch (error) {
    logger.error('[Clerk] Exchange failed', error);
    return res.status(500).json({ message: 'Clerk exchange failed' });
  }
};

const clerkWebhookController = async (req, res) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET?.trim();
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    if (webhookSecret && !verifyClerkWebhookSignature(rawBody, req.headers, webhookSecret)) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    const event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body;
    if (!event?.type || !event?.data) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    if (event.type === 'user.deleted') {
      const clerkId = event.data.id;
      if (typeof clerkId === 'string') {
        const user = await findUser({ clerkId });
        if (user) {
          await updateUser(String(user._id ?? user.id), { role: SystemRoles.USER });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error('[Clerk] Webhook failed', error);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = {
  clerkExchangeController,
  clerkWebhookController,
};
