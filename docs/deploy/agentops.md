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
