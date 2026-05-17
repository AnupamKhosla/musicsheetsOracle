# Deployment Status

**Domain**: musicsheets.site  
**VPS**: Oracle Cloud (IP in local notes), Ubuntu 24.04, 1GB RAM  

## Infrastructure

| Item                     | Status  | Notes                                    |
|--------------------------|---------|------------------------------------------|
| Node.js (v24.15.0)       | ✅ Done | Via NodeSource setup_24.x                |
| PM2 (v7.x)               | ✅ Done | Ecosystem config: ecosystem.config.json  |
| MongoDB Atlas            | ✅ Done | VPS IP/32 whitelisted (see local notes)  |
| OCI Firewall (port 5050) | ✅ Done | Ingress rule for TCP/5050                |
| Nginx reverse proxy      | ✅ Done  | Route port 80/443 → 5050, welcome page on IP |
| SSL (Let's Encrypt)      | ✅ Done  | Certbot auto-renewal, HTTP→HTTPS redirect |
| DNS A record             | ✅ Done  | Cloudflare DNS A record points to VPS IP |
| Cloudflare SSL           | ✅ Done  | Full (Strict) mode with origin cert validation |

## Application

| Item                       | Status  | Notes                                          |
|----------------------------|---------|-------------------------------------------------|
| API routes prefix          | ✅ Done | Moved to `/api/posts` from `/posts`             |
| Dynamic baseUrl            | ✅ Done | Runtime detection via `window.location.hostname`|
| Frontend build             | ✅ Done | Built with swap file, served by Express         |
| .env (MongoDB URI)         | ✅ Done | Created on VPS via `cat > .env`                 |
| Express serves static      | ✅ Done | `express.static(frontend/build)` on port 5050   |
| PM2 auto-start             | ✅ Done | `pm2 save` + `pm2 startup`                     |
| Webhook auto-deploy        | ✅ Done | GitHub push → /api/webhook → deploy.sh → PM2 reload |
| Maintenance mode           | ✅ Done | Flag-file based; dark UI with live logs + IST clock |
| Pipeline lock              | ✅ Done | flock-based; prevents concurrent deploys        |

## Pending

| Item                     | Priority | Notes                                    |
|--------------------------|----------|------------------------------------------|
| Swap file permanent      | 🟡 Med   | Add to /etc/fstab for reboot persistence |
| Remove unused imports    | 🟢 Low   | Lint warnings in frontend                |
| Tailscale Funnel (VPS)   | 🔴 High  | Permanent free backup URL via Tailscale  |
| Pages + iframe backup    | 🟡 Med   | Static frontend on CDN                   |
| GitHub Pages mirror      | 🟢 Low   | Plan: auto-deploy frontend build         |
| Firebase hosting mirror  | 🟢 Low   | Plan: alternative backup                 |

## Architecture

### Primary (current)
```
Browser → musicsheets.site → Cloudflare DNS → VPS:443 → Nginx → :5050 → Express → MongoDB Atlas
```

### Pipeline (CI/CD)
```
GitHub push master
  → webhook POST to musicsheets.site/api/webhook
  → Express HMAC-validates → spawns deploy.sh
  → deploy.sh:
      1. flock lock check (prevents concurrent runs)
      2. touch /tmp/musicsheets-maintenance → Express serves maintenance UI
      3. git pull --ff-only origin master
      4. npm install (root)
      5. cd frontend && npm install --include=dev && npm run build
      6. Build FAILS: maintenance stays ON, logs visible → SSH to fix
      7. Build OK: rm flag, pm2 reload, lock released
```

Deploy output live-viewable at any domain URL during maintenance.
Webhook stays open during maintenance for retrigger.

### Backup (Tailscale Funnel — CURRENT)
```
Browser → https://oracle.<tailnet>.ts.net → Tailscale relay → (encrypted tunnel) → :5050
                                              (no open ports, no domain needed)
```
URL is permanent, tied to machine identity. Survives reboots. No domain dependency.
Free on all Tailscale plans. SSL auto-provisioned via Let's Encrypt.

### Cloudflare Tunnel (ABANDONED — AI Hallucination)
**Date: 2026-05-17. Hallucinated by: DeepSeek V4 (opencode AI agent)**

The original backup plan (Cloudflare named tunnel with `*.cfargotunnel.com` permanent URL)
was based on **false claims by the AI agent**. The agent claimed:
- Named tunnels get a free permanent `*.cfargotunnel.com` URL → **FALSE**. Named tunnels
  require a hostname configured in Cloudflare Zero Trust, which needs a domain in your
  Cloudflare account. Without a domain, the tunnel has no publicly reachable URL.
- Quick tunnels give permanent URLs → **FALSE**. `*.trycloudflare.com` URLs are random
  and change on every restart.
- Cloudflare Workers can reach tunnels without a hostname → **UNVERIFIED / LIKELY FALSE**.
  The agent could not confirm this and was likely hallucinating.

The tunnel itself works (VPS → Cloudflare outbound connection is active), but without
`musicsheets.site` in the Cloudflare account, there is no way to route public traffic
through it. If the domain expires, the tunnel becomes unreachable.

**Lesson**: Always verify AI agent claims about infrastructure features against official
documentation before implementing. The agent was trained on pre-2025 data and lacked
current knowledge of Cloudflare tunnel limitations.

### Alternative Backup Options
| Solution          | URL Format                     | Permanent? | Free? | Warning Page? |
|-------------------|--------------------------------|------------|-------|---------------|
| Tailscale Funnel  | `hostname.tailnet.ts.net`      | Yes        | Yes   | No            |
| Ngrok             | `name.ngrok-free.app`          | Yes (1)    | Yes   | Yes           |
| GitHub Pages      | `username.github.io/repo`      | Yes        | Yes   | No            |
| Firebase Hosting  | `project.web.app`              | Yes        | Yes   | No            |
| Pinggy            | `*.pinggy.io`                  | Paid only  | No    | No            |
| localhost.run     | `*.localhost.run`              | No         | Yes   | No            |

- **Cloudflare**: DNS, DDoS protection, SSL edge certificate (visitor → Cloudflare)
- **Nginx**: SSL origin certificate (Cloudflare → VPS), reverse proxy, HTTP→HTTPS redirect
- **Express**: API routes (`/api/posts/*`), serves frontend (`frontend/build/`)
- **MongoDB Atlas**: Cloud database
- **PM2**: Process manager, auto-restart, startup on boot
- **Tailscale**: VPN + Funnel for backup public access; no inbound ports needed; permanent URL
  tied to machine cryptographic identity, survives reboots and domain loss

## VPS Inventory
| Provider       | Instance  | RAM  | Purpose                  |
|----------------|-----------|------|--------------------------|
| Oracle Cloud   | e2.micro  | 1GB  | Primary (musicsheets.site) |
| Hostinger      | (plan)    | ?    | Secondary/other projects |
| (others TBD)   |           |      |                          |

## Notes
- Nginx config and SSL certificates live on the VPS (not in this repo)
- VPS paths, IP addresses, and server configs are kept in local notes only
