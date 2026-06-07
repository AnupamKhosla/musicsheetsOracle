# Deployment Status

**Domain**: musicsheets.site
**VPS**: Oracle Cloud (IP in local notes), Ubuntu 24.04, 1GB RAM
**Stack**: Next.js 16.2 + React 19.2 + MongoDB Atlas

## Infrastructure

| Item                     | Status  | Notes |
|--------------------------|---------|-------|
| Node.js (v24.15.0)       | ✅ Done | Via NodeSource setup_24.x |
| PM2 (v7.x)               | ✅ Done | Ecosystem config: `ecosystem.config.json` |
| MongoDB Atlas            | ✅ Done | VPS IP/32 whitelisted |
| OCI Firewall (port 5050) | ✅ Done | Ingress rule for TCP/5050 |
| Nginx reverse proxy      | ✅ Done | Route 80/443 → 5050, welcome page on IP |
| Nginx rate limiting      | ✅ Done | Two zones: static 100r/s, dynamic 50r/s; Cloudflare real IP |
| Nginx gzip               | ✅ Done | Template in `ops/nginx/`, gzip_static + 2x types |
| Build-time gzip          | ⚠️ Removed | gzipper removed (Next.js has built-in compression) |
| SSL (Let's Encrypt)      | ✅ Done | Certbot auto-renewal, HTTP→HTTPS redirect |
| DNS A record             | ✅ Done | Cloudflare DNS |
| Cloudflare SSL           | ✅ Done | Full (Strict) mode |
| Tailscale Funnel         | ✅ Done | Backup: `musicsheets.tail0c6a25.ts.net` |
| Swap file                | ✅ Done | `/swapfile 4G` in `/etc/fstab` |

## Application

| Item                       | Status  | Notes |
|----------------------------|---------|-------|
| Next.js 16.2 + React 19.2  | ✅ Done | Migrated from CRA+Express |
| API routes                 | ✅ Done | `src/app/api/posts/*` (GET/POST/DELETE, search, count, latest) |
| Webhook (auto-deploy)      | ✅ Done | `src/app/api/webhook/route.ts` |
| Health check               | ✅ Done | `src/app/api/health/route.ts` |
| Pipeline logs endpoint     | ✅ Done | `src/app/api/logs/route.ts` |
| Maintenance mode           | ✅ Done | `MAINTENANCE` flag file + `MaintenancePage` component |
| Platform detection         | ✅ Done | `src/lib/platform.ts` — runtime VPS vs Vercel/Edge detection |
| PM2 auto-start             | ✅ Done | `pm2 save` + `pm2 startup` |

## Pending

| Item                     | Priority | Notes |
|--------------------------|----------|-------|
| Rate limiting (app-level)| 🟡 Med   | `express-rate-limit` no longer applies; consider Next.js middleware or Nginx |
| Pages + iframe backup    | 🟡 Med   | Static frontend on CDN |
| GitHub Pages mirror      | 🟢 Low   | |
| Firebase hosting mirror  | 🟢 Low   | |

## Architecture

### Primary (current)
```
Browser → musicsheets.site → Cloudflare DNS → VPS:443 → Nginx → :5050 → Next.js → MongoDB Atlas
```

Next.js handles everything: pages, API routes, static files — all in one process.
No Express, no separate frontend build step.

### Pipeline (CI/CD)
```
GitHub push master
  → webhook POST to musicsheets.site/api/webhook
  → HMAC-validated → spawns deploy.sh
  → deploy.sh:
      1. flock lock (ops/deploy-lock)
      2. echo "1" > MAINTENANCE → layout.tsx serves MaintenancePage
      3. git pull --ff-only origin master
      4. npm install --include=dev
      5. npx next build
      6. Build FAILS: MAINTENANCE stays "1", logs visible → SSH to fix
      7. Build OK: echo "0" > MAINTENANCE, pm2 reload
```

All pipeline state lives in repo:
- `MAINTENANCE` — flag file (committed, default "0")
- `ops/deploy-lock` — flock lock (gitignored)
- `ops/deploy-logs.html` — live logs (gitignored)

The webhook only activates on bare VPS (detected via `isManagedPlatform()`).
On Vercel/Cloudflare Pages/etc., the webhook returns 404 — those platforms have their own CI/CD.

### Backup (Tailscale Funnel)
```
Browser → musicsheets.tail0c6a25.ts.net → Tailscale relay → :8080 → Nginx → :5050 → Next.js
```
Funnel through Nginx, shares rate limiting rules. Permanent URL, free, survives reboots.

## VPS Inventory
| Provider       | Instance  | RAM  | Purpose |
|----------------|-----------|------|---------|
| Oracle Cloud   | e2.micro  | 1GB  | Primary (musicsheets.site) |
| Hostinger      | (plan)    | ?    | Secondary/other |

## Notes
- Nginx config: `ops/nginx/musicsheets.site.conf` (sanitized, no secrets)
- SSL certs on VPS only (Certbot)
- Platform detection uses runtime env vars (VERCEL, CF_PAGES, K_SERVICE, etc.) — no manual config
