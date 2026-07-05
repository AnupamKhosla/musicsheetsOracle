# Setup

## Prerequisites

- Node.js v24+
- MongoDB Atlas (or local MongoDB)
- Ruby 3.x (for local Jekyll docs preview)

## Environment Variables

Create `.env` in project root:

```env
ATLAS_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
DELETE_KEY=your-secret-delete-key
WEBHOOK_SECRET=your-github-webhook-secret
```

## Quick Commands

```bash
# Development
npm run start_dev          # Next.js dev server on :3000

# Production build + run
npm run build              # next build
npm start                  # next start on :5050

# Tests
npm test

# Documentation (Jekyll)
cd docs && bundle exec jekyll serve
# Serves at http://localhost:4000

# Migration
npm run migrate           # Backfill existing sheets to DB
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 |
| UI | React 19 |
| Database | MongoDB Atlas (free tier M0) |
| Western notation | OpenSheetMusicDisplay |
| Audio | Tone.js |
| Server | Node.js v24 on Ubuntu 24.04 |
| Process manager | PM2 |
| Reverse proxy | Nginx + Let's Encrypt SSL |
| DNS | Cloudflare (Full Strict SSL) |

## Fallback URLs

| URL | Purpose |
|-----|---------|
| [musicsheets.site](https://musicsheets.site) | Primary — Nginx + Let's Encrypt + Cloudflare |
| [musicsheets.tail0c6a25.ts.net](https://musicsheets.tail0c6a25.ts.net) | Backup — Tailscale Funnel, survives reboots |

## Deployment

VPS: Oracle Cloud e2.micro, 1GB RAM.

Deploy pipeline: GitHub push → webhook → `git pull` → `npm install` → `next build` → `pm2 reload`.

Config files:
- `ecosystem.config.json` — PM2 process config
- `ops/` — Nginx, deploy scripts
- `MAINTENANCE` — Flag file (set to `1` during deploys)

## Docs

Documentation lives in `docs/` and is served via GitHub Pages + Jekyll.

```bash
cd docs
bundle exec jekyll serve   # Local preview at localhost:4000
```
