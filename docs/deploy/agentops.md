# AgentOps deployment (artemiis.one)

This guide covers production deployment for the AgentOps fork: Supabase Auth, Pipedream MCP, artifacts, spaces, and the operator console.

## Architecture

| Component | Host | Domain |
|---|---|---|
| Frontend | Vercel `agent-workspace` | `artemiis.one` |
| API | Coolify `librechat-vercel` on studio-one | `api.artemiis.one` or sslip.io |

## Auth

Authentication uses **Supabase Auth** on the frontend with a backend token exchange:

1. User signs in on branded `/login`, `/register`, `/forgot-password` pages (Supabase Auth).
2. Frontend exchanges the Supabase access token at `POST /api/auth/supabase/exchange`.
3. API verifies the token with Supabase, upserts the MongoDB user (`supabaseId`), and issues a LibreChat JWT.
4. Protected API routes continue to use the LibreChat JWT.

### Frontend environment (Vercel)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend environment (Coolify)

```env
SUPABASE_AUTH_ENABLED=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DOMAIN_CLIENT=https://artemiis.one
DOMAIN_SERVER=https://api.artemiis.one
PIPEDREAM_CLIENT_ID=...
PIPEDREAM_CLIENT_SECRET=...
PIPEDREAM_PROJECT_ID=proj_...
PIPEDREAM_ENVIRONMENT=development
```

### Pipedream Connect (borrow from Vercel)

Pipedream credentials already exist on Vercel **`salesflow/agentops-mcp-chat`** (and `vercelchatbot`) as sensitive env vars:

- `PIPEDREAM_CLIENT_ID`
- `PIPEDREAM_CLIENT_SECRET`
- `PIPEDREAM_PROJECT_ID`
- `PIPEDREAM_PROJECT_ENVIRONMENT` (maps to `PIPEDREAM_ENVIRONMENT` on the API)

They are **not** present on any Coolify app today. Copy them into Coolify service **`librechat-vercel`** (`ysoisbo6gtf0sbmokrhoqfm2`), then redeploy the API.

With a Vercel token that can decrypt sensitive env vars:

```bash
VERCEL_TOKEN=... COOLIFY_API_TOKEN=... COOLIFY_URL=... node scripts/sync-pipedream-env.mjs
```

### Supabase database

Apply `supabase/migrations/001_profiles_and_access.sql` to create:

- `profiles` — global user profile fields
- `user_roles` — app-specific roles
- `app_access` — app entitlements (future OneAccess-ready)

## Deploy checklist

1. Apply Supabase migration.
2. Set Vercel env vars and redeploy frontend.
3. Set Coolify API env vars and redeploy API image.
4. Confirm `POST /api/auth/supabase/exchange` returns 200 with a valid Supabase session.
