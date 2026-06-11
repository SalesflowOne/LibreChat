const { logger } = require('@librechat/data-schemas');
const {
  resolvePipedreamRuntimeConfig,
  resolvePipedreamApps,
  listPipedreamUserAccounts,
  createPipedreamConnectToken,
  getPipedreamExternalUserId,
} = require('@librechat/api');
const { getAppConfig } = require('~/server/services/Config');

async function getPipedreamConfig(req) {
  const appConfig = await getAppConfig({ role: req.user?.role });
  return resolvePipedreamRuntimeConfig(appConfig?.config?.pipedream);
}

const getPipedreamStatusController = async (req, res) => {
  try {
    const runtime = await getPipedreamConfig(req);
    if (!runtime) {
      return res.status(200).json({ enabled: false, apps: [] });
    }

    const apps = await resolvePipedreamApps(runtime);

    return res.status(200).json({
      enabled: true,
      projectId: runtime.projectId,
      environment: runtime.environment,
      apps,
    });
  } catch (error) {
    logger.error('[Pipedream] Failed to load status', error);
    return res.status(500).json({ message: 'Failed to load Pipedream status' });
  }
};

const getPipedreamAppsController = async (req, res) => {
  try {
    const runtime = await getPipedreamConfig(req);
    if (!runtime) {
      return res.status(404).json({ message: 'Pipedream is not configured' });
    }

    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;

    const apps = await resolvePipedreamApps(runtime, {
      q,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });

    return res.status(200).json({ apps });
  } catch (error) {
    logger.error('[Pipedream] Failed to list apps', error);
    return res.status(500).json({ message: 'Failed to load Pipedream apps' });
  }
};

const getPipedreamAccountsController = async (req, res) => {
  try {
    const runtime = await getPipedreamConfig(req);
    if (!runtime) {
      return res.status(404).json({ message: 'Pipedream is not configured' });
    }

    const appSlug = typeof req.query.app === 'string' ? req.query.app : undefined;
    const accounts = await listPipedreamUserAccounts(
      getPipedreamExternalUserId(req.user),
      runtime,
      appSlug,
    );
    return res.status(200).json({ accounts });
  } catch (error) {
    logger.error('[Pipedream] Failed to list accounts', error);
    return res.status(500).json({ message: 'Failed to list connected accounts' });
  }
};

const createPipedreamConnectTokenController = async (req, res) => {
  try {
    const runtime = await getPipedreamConfig(req);
    if (!runtime) {
      return res.status(404).json({ message: 'Pipedream is not configured' });
    }

    const { appSlug } = req.body ?? {};
    if (!appSlug || typeof appSlug !== 'string') {
      return res.status(400).json({ message: 'appSlug is required' });
    }

    if (runtime.apps.length > 0) {
      const allowedApp = runtime.apps.some((app) => app.slug === appSlug);
      if (!allowedApp) {
        return res.status(400).json({ message: 'Unknown Pipedream app' });
      }
    }

    const domainClient = process.env.DOMAIN_CLIENT || 'http://localhost:3090';
    const token = await createPipedreamConnectToken({
      externalUserId: getPipedreamExternalUserId(req.user),
      config: runtime,
      appSlug,
      allowedOrigins: [domainClient.replace(/\/$/, '')],
      successRedirectUri: `${domainClient.replace(/\/$/, '')}/?pipedream=connected`,
      errorRedirectUri: `${domainClient.replace(/\/$/, '')}/?pipedream=error`,
    });

    return res.status(200).json(token);
  } catch (error) {
    logger.error('[Pipedream] Failed to create connect token', error);
    return res.status(500).json({ message: 'Failed to create connect link' });
  }
};

module.exports = {
  getPipedreamStatusController,
  getPipedreamAppsController,
  getPipedreamAccountsController,
  createPipedreamConnectTokenController,
};
