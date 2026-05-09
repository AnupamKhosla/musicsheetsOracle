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

## Pending

| Item                     | Priority | Notes                                    |
|--------------------------|----------|------------------------------------------|
| Swap file permanent      | 🟡 Med   | Add to /etc/fstab for reboot persistence |
| Remove unused imports    | 🟢 Low   | Lint warnings in frontend                |
| Cloudflared tunnel (VPS) | 🔴 High  | Permanent backup subdomain               |
| Worker.dev proxy         | 🔴 High  | Pretty backup URL → tunnel               |
| Pages + iframe backup    | 🟡 Med   | Static frontend on CDN                   |
| GitHub Pages mirror      | 🟢 Low   | Plan: auto-deploy frontend build         |
| Firebase hosting mirror  | 🟢 Low   | Plan: alternative backup                 |

## Architecture

### Primary (current)
```
Browser → musicsheets.site → Cloudflare DNS → VPS:443 → Nginx → :5050 → Express → MongoDB Atlas
```

### Backup (Cloudflare Tunnel)
```
Browser → name.cfargotunnel.com → Cloudflare Edge → cloudflared (outbound tunnel) → :5050
                                                       (bypasses nginx, no open inbound ports)
```

### Backup with pretty name (Worker proxy)
```
Browser → musicsheets.workers.dev → Worker fetch() → name.cfargotunnel.com → cloudflared → :5050
```

### Future backups
```
Browser → musicsheets.pages.dev → <iframe src="tunnel.cfargotunnel.com">
Browser → username.github.io/musicsheets/ → <iframe src="tunnel.cfargotunnel.com">
```

- **Cloudflare**: DNS, DDoS protection, SSL edge certificate (visitor → Cloudflare)
- **Nginx**: SSL origin certificate (Cloudflare → VPS), reverse proxy, HTTP→HTTPS redirect
- **Express**: API routes (`/api/posts/*`), serves frontend (`frontend/build/`)
- **MongoDB Atlas**: Cloud database
- **PM2**: Process manager, auto-restart, startup on boot
- **cloudflared**: Creates outbound tunnel to Cloudflare edge; no inbound ports needed; systemd service auto-starts on boot

## VPS Inventory
| Provider       | Instance  | RAM  | Purpose                  |
|----------------|-----------|------|--------------------------|
| Oracle Cloud   | e2.micro  | 1GB  | Primary (musicsheets.site) |
| Hostinger      | (plan)    | ?    | Secondary/other projects |
| (others TBD)   |           |      |                          |

## Notes
- Nginx config and SSL certificates live on the VPS (not in this repo)
- VPS paths, IP addresses, and server configs are kept in local notes only
