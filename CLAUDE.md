# Glitch Garage — Project Context

AI-powered car build planner. Node/Express backend + React/Vite frontend, deployed on Railway.

## Live URLs
- Frontend: https://frontend-production-dd93.up.railway.app
- Backend API: https://backend-production-d2dd.up.railway.app

## Stack
- **Backend:** Node.js + Express, SQLite via `@libsql/client`, JWT auth
- **Frontend:** React 18 + Vite, React Router v6, Axios
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`), prompt caching on system prompts
- **Hosting:** Railway — both services, persistent volume at `/data`

## Project Structure
```
glitch-garage/
├── backend/
│   ├── server.js              ← Express entry, all routes registered here
│   ├── db/database.js         ← SQLite init (CREATE TABLE IF NOT EXISTS — no migrations)
│   ├── middleware/auth.js     ← JWT authenticate middleware
│   └── routes/
│       ├── auth.js            ← POST /api/auth/register, /login
│       ├── builds.js          ← POST /api/builds/generate, GET /api/builds/history
│       ├── admin.js           ← GET/PATCH /api/admin/users
│       ├── junkyards.js       ← GET /api/junkyards
│       ├── groups.js          ← full CRUD for crews/groups feature
│       ├── assistant.js       ← POST /api/assistant/chat (Garage Doc)
│       └── chat.js            ← GET/POST /api/chat/messages, pin, report, delete
└── frontend/src/
    ├── App.jsx                ← BrowserRouter, all routes, AuthProvider, AssistantWidget
    ├── context/AuthContext.jsx
    ├── pages/
    │   ├── Home.jsx, Login.jsx, Register.jsx
    │   ├── BuildGenerator.jsx, Dashboard.jsx, Admin.jsx
    │   ├── Groups.jsx, GroupDetail.jsx, JoinGroup.jsx
    │   └── Chat.jsx           ← Global Garage Chat
    └── components/
        ├── Navbar.jsx         ← nav links: BUILD, HISTORY, CREWS, CHAT (auth-only)
        ├── AssistantWidget.jsx ← floating Garage Doc widget (bottom-right)
        ├── BuildCard.jsx
        └── GlitchText.jsx
```

## Database Tables
All auto-created on startup via `executeMultiple` in `db/database.js`:
- `users` — id, email, username, password (bcrypt), is_admin, is_active
- `builds` — id, user_id, year, make, model, budget, result (JSON), tokens_used
- `api_usage` — token tracking per request
- `groups` — id, name, description, invite_code (8-char hex), created_by
- `group_members` — group_id, user_id, active_build_id, active_tier, UNIQUE(group_id, user_id)
- `build_progress` — build_id, user_id, tier, mod_index, UNIQUE(build_id, user_id, tier, mod_index)
- `group_comments` — group_id, build_id, user_id, content
- `global_chat_messages` — user_id, content, car_info, is_deleted, is_pinned
- `chat_reports` — message_id, reporter_id, UNIQUE(message_id, reporter_id)

## Key Rules
- `FREE_BUILDS_PER_DAY = 2` in builds.js — everyone gets 2, no admin exception
- Build generator uses `CLAUDE_MODEL` env var (currently `claude-haiku-4-5`)
- Garage Doc uses `ASSISTANT_MODEL` env var (defaults to `claude-haiku-4-5`)
- Global chat: 8s cooldown, 300 char limit, soft-delete only, one report per user per message
- Chat polls `GET /api/chat/messages?after=<lastId>` every 3.5s

## Deployment (IMPORTANT)
GitHub auto-deploy webhook is broken — always deploy via Railway CLI from repo root:
```bash
RAILWAY_API_TOKEN=640617de-fbc4-411a-8c25-347afa1c4229 railway link \
  --project 22e06b76-215d-46ed-a613-f7a7da5ad827 \
  --environment 5b51fff9-4a65-4da0-b1ab-cfccf8d7a83a \
  --service backend   # or frontend
RAILWAY_API_TOKEN=640617de-fbc4-411a-8c25-347afa1c4229 railway up --service backend --detach
```
Never run `railway up` from a subdirectory.

## Known Issues / Fixes Applied
- **PWA service worker** caches aggressively — `skipWaiting + clientsClaim` set in `vite.config.js`. Users seeing stale UI should open DevTools → Application → Service Workers → Unregister, then hard refresh.
- **SPA routing** — `frontend/package.json` start script must use `serve dist -s` (the `-s` flag). Without it, direct navigation to `/chat`, `/groups/:id`, etc. returns 404.
- **Railway CLI directory** — always run `railway up` from `/glitch-garage/` root, not from `frontend/` or `backend/` subdirectories.

## Environment Variables (Backend — set in Railway)
| Var | Notes |
|-----|-------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `CLAUDE_MODEL` | Model for build generator (currently haiku-4-5) |
| `ASSISTANT_MODEL` | Model for Garage Doc (defaults to haiku-4-5) |
| `ADMIN_EMAIL` | blaz.n54@icloud.com |
| `JWT_SECRET` | Auth token signing |
| `DB_PATH` | `/data/glitch-garage.db` |
| `FRONTEND_URL` | Frontend Railway URL (for CORS) |
