CLAUDE.md

## Cursor Cloud specific instructions

### Services (dev)

| Service | Port | Start (tmux session name) |
|---|---|---|
| MongoDB | 27017 | `mongodb` — `mongod --dbpath /workspace/data-node --bind_ip 127.0.0.1 --port 27017` |
| Backend | 3080 | `librechat-backend` — `npm run backend:dev` from repo root |
| Frontend (Vite) | 3090 | `librechat-frontend` — `npm run frontend:dev` from repo root |

MongoDB is **not** started by the VM update script. This environment has no systemd; start `mongod` manually (or use Docker Compose) before the backend. Use `mongosh --eval 'db.runCommand({ ping: 1 })'` to verify.

Copy `.env` from `.env.example` if missing. For cloud dev without Meilisearch, set `SEARCH=false`. Optional `librechat.yaml` is not required for basic login/chat; the backend logs a warning if it is absent.

### Standard commands

See `CLAUDE.md` **Development Commands** and **Testing** for install (`npm run smart-reinstall`), build, lint, and per-workspace Jest runs.

Root `npm run lint` may fail with “No files matching the pattern” in some shells; run ESLint on a path instead, e.g. `npx eslint client/src --max-warnings 0`.

### Health checks

- Backend: `curl -sf http://localhost:3080/health` → `OK`
- Frontend dev: `http://localhost:3090` (proxies `/api` to 3080)

### Gotchas

- RAG API warnings on startup are expected when RAG/vectordb are not running; file-upload/RAG features need `docker compose` RAG services or `rag.yml`.
- `npm run frontend:dev` requires the backend on 3080 first.
- First-time DB init creates collections on backend start; use `npm run create-user` for a local account when `ALLOW_REGISTRATION=true`.
