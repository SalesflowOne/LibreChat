#!/usr/bin/env node
/**
 * Copy Pipedream Connect credentials from a Vercel project into Coolify
 * `librechat-vercel` (artemiis API). Requires a Vercel token that can decrypt
 * sensitive env vars (team owner/developer) and Coolify API access.
 *
 * Usage:
 *   VERCEL_TOKEN=... COOLIFY_API_TOKEN=... COOLIFY_URL=... \\
 *     node scripts/sync-pipedream-env.mjs
 *
 * Optional:
 *   VERCEL_TEAM_ID=team_... (default: salesflow)
 *   VERCEL_PROJECT=agentops-mcp-chat
 *   COOLIFY_SERVICE_UUID=ysoisbo6gtf0sbmokrhoqfm2
 */

const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID ?? 'team_Na274IDFwAHRPi5JdFrzvRUk';
const VERCEL_PROJECT = process.env.VERCEL_PROJECT ?? 'agentops-mcp-chat';
const COOLIFY_SERVICE_UUID = process.env.COOLIFY_SERVICE_UUID ?? 'ysoisbo6gtf0sbmokrhoqfm2';
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN;
const COOLIFY_URL = process.env.COOLIFY_URL?.replace(/\/$/, '');
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

const SOURCE_KEYS = [
  'PIPEDREAM_CLIENT_ID',
  'PIPEDREAM_CLIENT_SECRET',
  'PIPEDREAM_PROJECT_ID',
  'PIPEDREAM_PROJECT_ENVIRONMENT',
];

const TARGET_KEYS = {
  PIPEDREAM_CLIENT_ID: 'PIPEDREAM_CLIENT_ID',
  PIPEDREAM_CLIENT_SECRET: 'PIPEDREAM_CLIENT_SECRET',
  PIPEDREAM_PROJECT_ID: 'PIPEDREAM_PROJECT_ID',
  PIPEDREAM_PROJECT_ENVIRONMENT: 'PIPEDREAM_ENVIRONMENT',
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!VERCEL_TOKEN) {
  fail('VERCEL_TOKEN is required');
}
if (!COOLIFY_API_TOKEN || !COOLIFY_URL) {
  fail('COOLIFY_API_TOKEN and COOLIFY_URL are required');
}

async function vercel(path) {
  const response = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vercel ${path} failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function coolify(method, path, body) {
  const response = await fetch(`${COOLIFY_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${COOLIFY_API_TOKEN}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Coolify ${method} ${path} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function loadVercelPipedreamEnv(projectId) {
  const { envs } = await vercel(`/v10/projects/${projectId}/env?teamId=${VERCEL_TEAM_ID}`);
  const values = {};

  for (const key of SOURCE_KEYS) {
    const entry = envs.find((env) => env.key === key && env.target?.includes('production'));
    if (!entry) {
      continue;
    }
    const detail = await vercel(
      `/v10/projects/${projectId}/env/${entry.id}?teamId=${VERCEL_TEAM_ID}&decrypt=true`,
    );
    values[key] = detail.value ?? '';
  }

  return values;
}

async function upsertCoolifyEnv(existingByKey, key, value) {
  const payload = {
    key,
    value,
    is_preview: false,
    is_build_time: false,
    is_literal: false,
  };

  if (existingByKey[key]) {
    await coolify('PATCH', `/api/v1/services/${COOLIFY_SERVICE_UUID}/envs/${existingByKey[key]}`, payload);
    return 'updated';
  }

  await coolify('POST', `/api/v1/services/${COOLIFY_SERVICE_UUID}/envs`, payload);
  return 'created';
}

async function main() {
  const projects = await vercel(`/v9/projects?teamId=${VERCEL_TEAM_ID}&search=${VERCEL_PROJECT}`);
  const project = projects.projects?.find((item) => item.name === VERCEL_PROJECT);
  if (!project) {
    fail(`Vercel project not found: ${VERCEL_PROJECT}`);
  }

  const source = await loadVercelPipedreamEnv(project.id);
  const missing = SOURCE_KEYS.filter((key) => !source[key]);
  if (missing.length > 0) {
    fail(
      `Missing or undecryptable Vercel values: ${missing.join(', ')}. Use a token with sensitive env access.`,
    );
  }

  const existing = await coolify('GET', `/api/v1/services/${COOLIFY_SERVICE_UUID}/envs`);
  const existingByKey = Object.fromEntries(existing.map((env) => [env.key, env.uuid]));

  for (const [sourceKey, targetKey] of Object.entries(TARGET_KEYS)) {
    const action = await upsertCoolifyEnv(existingByKey, targetKey, source[sourceKey]);
    console.log(`${targetKey}: ${action}`);
  }

  console.log('Done. Redeploy the librechat-vercel API service in Coolify.');
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
