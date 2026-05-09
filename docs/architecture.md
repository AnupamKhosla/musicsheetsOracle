# Architecture: Frontend-Backend Routing

## Overview

The app uses **runtime hostname detection** in `frontend/src/config.js` to determine where API requests go. No build-time env vars, no hardcoded domains — just `window.location` checks.

## Ports

| Port | What | Role |
|------|------|------|
| `:3000` | CRA dev server (React) | Development: hot reload, serves `src/` files. No API routes. |
| `:5050` | Express | Production: serves `frontend/build/` (static) + handles `/api/posts/*` |

## baseUrl Logic

```js
// frontend/src/config.js

let baseUrl = '';

// localhost:3000 — dev mode, frontend and backend on different ports
if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    baseUrl = 'http://localhost:5050';
}

// GitHub Pages / Cloudflare Pages — frontend hosted separately from backend
else if (window.location.hostname.includes('github.io')) {
    baseUrl = 'https://musicsheets.site';
}
else if (window.location.hostname.includes('pages.dev')) {
    baseUrl = 'https://musicsheets.site';
}

// Default: relative URL (same origin). Works for:
//   - localhost:5050 (Express serving both)
//   - musicsheets.site (nginx reverse proxy)
//   - *.cfargotunnel.com (Cloudflare Tunnel)
//   - *.trycloudflare.com (Cloudflare Quick Tunnel)
//   - *.workers.dev (Cloudflare Worker proxy)
```

## Routing Table

| User visits | Frontend served by | API calls go to | How |
|---|---|---|---|
| `localhost:3000` | CRA dev server | `http://localhost:5050/api/` | Absolute URL in baseUrl |
| `localhost:5050` | Express (`frontend/build/`) | Same origin `/api/` | Relative URL |
| `musicsheets.site` | Nginx → Express | Same origin `/api/` | Relative URL |
| `*.cfargotunnel.com` | Cloudflare Tunnel → Express | Same origin `/api/` | Relative URL |
| `*.trycloudflare.com` | Cloudflare Tunnel → Express | Same origin `/api/` | Relative URL |
| `*.workers.dev` | Worker proxy → Tunnel → Express | Same origin `/api/` | Relative URL |
| `user.github.io/...` | GitHub Pages (static) | `https://musicsheets.site/api/` | Absolute URL + CORS |
| `*.pages.dev` | Cloudflare Pages (static) | `https://musicsheets.site/api/` | Absolute URL + CORS |

## Deployment Paths

### Primary
```
Browser → musicsheets.site → Cloudflare DNS → VPS:443 → Nginx → :5050 → Express → MongoDB
```

### Backup (Cloudflare Tunnel)
```
Browser → *.cfargotunnel.com → Cloudflare Edge → cloudflared → :5050
```

### Backup with pretty name (Worker proxy)
```
Browser → *.workers.dev → Worker fetch() → *.cfargotunnel.com → cloudflared → :5050
```

### Detached frontend (future)
```
Browser → *.github.io / *.pages.dev → static files on CDN
    API calls → https://musicsheets.site → VPS → :5050
```

## Pipeline (Auto-Deploy)

Every `git push master` triggers:

```
GitHub push → POST /api/webhook (HMAC-SHA256)
            → Express validates → spawns deploy.sh
            → Maintenance flag → dark UI with live logs
            → git pull --ff-only → npm install → build → pm2 reload
            → Flag removed → site live
```

### Pipeline Files
- `server.js` — `/api/webhook` (POST, HMAC-validated), `/api/health` (GET), maintenance middleware
- `ops/scripts/deploy.sh` — flock lock, git pull, npm install --include=dev, build, pm2 reload
- `ops/maintenance/index.html` — dark UI, IST clock, colour-coded logs, copy button, auto-refresh

### Security
- `WEBHOOK_SECRET` in `.env` (gitignored, VPS-only)
- HMAC-SHA256 validation of `X-Hub-Signature-256` header
- Lock file prevents concurrent deploys
- Webhook endpoint stays open during maintenance for retrigger

## Deprecated

- `setBaseUrl.js` — previously wrote hardcoded URLs to `config.js` at build time. Replaced by runtime `window.location` detection. Keep for reference, do not run.
- `config_OLD.js` in `frontend/src/` — outdated build-time config. Keep for reference.

## Related Files

- `frontend/src/config.js` — baseUrl runtime detection
- `server.js` — Express app, serves static + API
- `frontend/package.json` — CRA dev server config
- `docs/deployment.md` — VPS infrastructure status
