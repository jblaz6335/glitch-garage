# Glitch Garage — AI Build Planner

Mobile-first PWA that takes a car + budget and returns three complete build plans (Budget, Mid-Range, Full Send) via Claude AI, plus a zip-code based junkyard finder.

## Stack

- **Frontend**: React 18 + Vite + vite-plugin-pwa
- **Backend**: Node.js / Express
- **DB**: SQLite (better-sqlite3, no setup needed)
- **AI**: Claude API (`claude-opus-4-7`) with prompt caching
- **Auth**: JWT (7-day expiry) + bcryptjs

---

## Prerequisites

- Node.js 18+
- An Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

---

## Setup

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=some-long-random-secret-here
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-opus-4-7
ADMIN_EMAIL=you@example.com     # this email gets admin on register
DB_PATH=./garage.db
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

App runs at **http://localhost:5173**

---

## Features

| Feature | Details |
|---|---|
| Build generation | 3 tiers: Budget / Mid-Range / Full Send. Parts list with costs, sourcing links, difficulty, time estimate |
| Junkyard finder | ZIP → Nominatim geocode → Overpass API salvage yard search within 80km + major chain links |
| Rate limiting | 3 builds/day per user (resets at midnight). Global 100 req/15min |
| User accounts | Register / login / JWT auth |
| Admin dashboard | Stats, user management (ban/unban), build log |
| PWA | Installable, offline-capable via Workbox service worker |
| Prompt caching | System prompt cached via `cache_control: ephemeral` — lowers repeat cost ~90% |

---

## Admin Access

Register with the email matching `ADMIN_EMAIL` in `.env`. The account is automatically flagged as admin at registration. No separate seeding needed.

---

## Project Structure

```
glitch-garage/
├── backend/
│   ├── db/database.js          SQLite init (users, builds, api_usage)
│   ├── middleware/auth.js       JWT verify + admin check
│   ├── routes/
│   │   ├── auth.js             register, login, /me
│   │   ├── builds.js           generate, history, remaining
│   │   ├── admin.js            stats, users, builds
│   │   └── junkyards.js        zip → salvage yards
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/favicon.svg
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── GlitchText.jsx
    │   │   ├── BuildCard.jsx
    │   │   ├── JunkyardFinder.jsx
    │   │   └── LoadingGlitch.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── BuildGenerator.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── Admin.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── vite.config.js
```

---

## PWA Icons

vite-plugin-pwa expects `public/icon-192.png` and `public/icon-512.png`. The app works without them in dev, but for a proper installable PWA generate PNGs from `favicon.svg`:

```bash
# with ImageMagick
convert -background none public/favicon.svg -resize 192x192 public/icon-192.png
convert -background none public/favicon.svg -resize 512x512 public/icon-512.png
```

---

## Build for production

```bash
# Frontend
cd frontend && npm run build   # outputs to dist/

# Backend (no build step — run with node or pm2)
cd backend && node server.js
```
