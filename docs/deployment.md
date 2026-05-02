# Deployment Status

**Domain**: musicsheets.site  
**VPS**: Oracle Cloud (129.80.183.152), Ubuntu 24.04, 1GB RAM  
**VPS Path**: /var/www/musicsheets.site  

## Infrastructure

| Item                     | Status  | Notes                                    |
|--------------------------|---------|------------------------------------------|
| Node.js (v24.15.0)       | ✅ Done | Via NodeSource setup_24.x                |
| PM2 (v7.x)               | ✅ Done | Ecosystem config: ecosystem.config.json  |
| MongoDB Atlas            | ✅ Done | 129.80.183.152/32 whitelisted            |
| OCI Firewall (port 5050) | ✅ Done | Ingress rule for TCP/5050                |

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
| Nginx reverse proxy      | 🔴 High  | Route port 80 → 5050                     |
| SSL (Let's Encrypt)      | 🔴 High  | Certbot with Nginx plugin                |
| DNS A record             | 🔴 High  | Point musicsheets.site to 129.80.183.152 |
| Swap file permanent      | 🟡 Med   | Add to /etc/fstab for reboot persistence |
| Remove unused imports    | 🟢 Low   | Lint warnings in frontend                |

## Architecture

```
Browser → (HTTPS:443) → Nginx → (HTTP:5050) → Express → MongoDB Atlas
```

- **Nginx**: SSL termination, static file caching, reverse proxy
- **Express**: API routes (`/api/posts/*`), serves frontend (`frontend/build/`)
- **MongoDB Atlas**: Cloud database
- **PM2**: Process manager, auto-restart, startup on boot
