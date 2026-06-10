# AgentOps deployment (artemiis.one)

This guide unblocks production for the AgentOps fork: Clerk auth, Pipedream MCP, artifacts, spaces, and the operator console.

## Architecture

| Layer | Host | Notes |
|---|---|---|
| Frontend | Vercel `agent-workspace` | `artemiis.one` (Clerk satellite) |
| API | Coolify `librechat-vercel` on studio-one | `api.artemiis.one` |
| Spaces (fallback) | Coolify on mcp-servers | `AGENTOPS_COOLIFY_SPACE_UUID` |

## Phase 0 — Backend image

1. Ensure GitHub Actions `dev-images.yml` runs on push to `main` (paths: `api/**`, `packages/**`, etc.).
2. Confirm secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.
3. After merge, image: `ghcr.io/salesflowone/librechat-dev-api:latest`.
4. In Coolify `librechat-vercel`, set compose image to the GHCR image (not `registry.librechat.ai/...`).
5. Add custom domain `api.artemiis.one` and point DNS to studio-one.

## Backend environment (Coolify)

```bash
CLERK_AUTH_ENABLED=true
CLERK_ONLY_AUTH=true
JWKS_URL=https://<clerk-domain>/.well-known/jwks.json
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

PIPEDREAM_CLIENT_ID=...
PIPEDREAM_CLIENT_SECRET=...
PIPEDREAM_PROJECT_ID=proj_...
PIPEDREAM_ENVIRONMENT=production

AGENTOPS_KEY_ENC_SECRET=<32+ char secret>
VERCEL_TOKEN=...
AGENTOPS_VERCEL_PROJECT=agent-workspace
VERCEL_TEAM_ID=...          # optional
AGENTOPS_COOLIFY_SPACE_UUID=...
AGENTOPS_COOLIFY_SPACE_URL=https://...

DOMAIN_CLIENT=https://artemiis.one
DOMAIN_SERVER=https://api.artemiis.one
```

## Frontend environment (Vercel agent-workspace)

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_CLERK_DOMAIN=artemiis.one
VITE_CLERK_IS_SATELLITE=true
VITE_CLERK_SIGN_IN_URL=https://oneaccess.one/sign-in
VITE_CLERK_SIGN_UP_URL=https://oneaccess.one/sign-up

LIBRECHAT_API_URL=https://api.artemiis.one
```

## Clerk webhook

Register `POST https://api.artemiis.one/api/auth/clerk/webhook` in the Clerk dashboard. Use the signing secret as `CLERK_WEBHOOK_SECRET`.

## Pipedream

External user IDs are scoped as `{orgId}:{userId}` via `x-pd-external-user-id`. Configure starter apps in `librechat.yaml` under `pipedream.apps`.

## Spaces

Primary deploy path: Vercel static HTML from artifact preview. Fallback: trigger Coolify redeploy on `mcp-servers` when `VERCEL_TOKEN` is unavailable.
