const { logger } = require('@librechat/data-schemas');
const { exchangeSupabaseSession, isSupabaseAuthEnabled } = require('@librechat/api');
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

const supabaseExchangeController = async (req, res) => {
  try {
    if (!isSupabaseAuthEnabled()) {
      return res.status(404).json({ message: 'Supabase auth is not enabled' });
    }

    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ message: 'Missing Supabase access token' });
    }

    const result = await exchangeSupabaseSession({
      accessToken: token,
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
      return res.status(401).json({ message: 'Invalid Supabase session' });
    }

    const dbUser = await getUserById(result.user.id, '-password -__v -totpSecret -backupCodes');
    return res.status(200).json({
      token: result.token,
      user: sanitizeUserForAuthResponse(dbUser ?? result.user),
    });
  } catch (error) {
    logger.error('[Supabase] Exchange failed', error);
    return res.status(500).json({ message: 'Supabase exchange failed' });
  }
};

module.exports = {
  supabaseExchangeController,
};
