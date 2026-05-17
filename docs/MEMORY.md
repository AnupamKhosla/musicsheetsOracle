# Persistent Memory for OpenCode Conversations

## Purpose
This file serves as persistent memory across OpenCode chat sessions. Since the AI does not retain context between conversations, this document maintains continuity by recording decisions, preferences, project state, and important context.

## Rules for AI Agents
- **At the start of every conversation**: Read this file first to understand current project state and past decisions
- **During conversations**: Reference this file when making decisions that build on past work
- **At the end of significant conversations**: Propose updates to this file to capture new decisions, changes, or important context

## Project State

### Current Status
- **Last Updated**: 2026-05-09
- **Active Branches**: master
- **Current Focus**: Pipeline COMPLETED. Next: Cloudflare free domain backup (tunnel + workers.dev).

### Recent Decisions
- Using PM2 for process management
- Using Nginx as reverse proxy (configured and deployed)
- Using Let's Encrypt for SSL (installed, auto-renewing)
- Using Cloudflare DNS + Full (Strict) SSL mode
- Welcome page on VPS IP, app served on domain
- Disabled `opencode-daytona` plugin (sandbox isolation issues)
- `rm` set to `ask` instead of `deny` for project file management

### User Preferences
- Always ask before executing actions (Ask First mode)
- Use modern ES modules (`.mjs`, `import`/`export`)
- Never use CommonJS

## Important Context
- Domain: musicsheets.site
- VPS: Oracle Cloud, Ubuntu 24.04, 1GB RAM (IP in local notes)
- Stack: Node.js/Express + React + MongoDB
- Nginx: reverse proxy localhost:5050, SSL via Let's Encrypt
- Cloudflare: DNS + Full (Strict) SSL
- OpenCode Config: `~/.config/opencode/opencode.json`
- OpenCode Plugins: vibeguard, dynamic-context-pruning, shell-strategy, websearch-cited, supermemory
- MCP Servers: context7, gh_grep

## Action Log
<!-- 
TEMPLATE for new entries (copy and fill):
- **Date**: YYYY-MM-DD
  - **Category**: [code/config/infrastructure/decision/bug/preference]
  - **Description**: What happened
  - **Files**: [file paths changed]
  - **Commands**: [any commands run]
-->
- **Date**: 2026-05-03
  - **Category**: infrastructure
  - **Description**: Created persistent memory system (MEMORY.md) and updated AGENTS.md with mandatory memory rules
  - **Files**: `docs/MEMORY.md`, `AGENTS.md`
  - **Commands**: None
- **Date**: 2026-05-03
  - **Category**: system
  - **Description**: Ran system-wide directory tree scan from root (3 levels deep) to verify file system access capabilities. Successfully mapped 782 directories and 2153 files.
  - **Files**: None
  - **Commands**: `tree -L 3 /`
- **Date**: 2026-05-03
  - **Category**: security
  - **Description**: Discussed sandboxing options for opencode. Determined opencode has no built-in sandbox. Recommended Docker containerization as industry-standard solution for true filesystem isolation.
  - **Files**: None
  - **Commands**: Searched for opencode config files, checked CLI flags
- **Date**: 2026-05-03
  - **Category**: research
  - **Description**: Discovered OpenCode plugin ecosystem. Relevant plugins found: `opencode-daytona` (isolated sandboxes), `opencode-devcontainers` (devcontainer isolation), `opencode-supermemory` (persistent memory). These provide native alternatives to Docker/manual MEMORY.md.
  - **Files**: None
  - **Commands**: Web research on OpenCode ecosystem
- **Date**: 2026-05-03
  - **Category**: config
  - **Description**: Deleted `AGENTS.md`. Fixed malformed `~/.config/opencode/opencode.json` (removed extra comma after `"permission": {`). Added `"sudo rm -rf": "deny"` rule.
  - **Files**: `AGENTS.md` (deleted), `~/.config/opencode/opencode.json`
  - **Commands**: `edit` on opencode.json
- **Date**: 2026-05-03
  - **Category**: security
  - **Description**: Discovered sandbox hierarchy through testing: (1) Infrastructure tool permissions (pattern-based like `ssh*`) are absolute and cannot be overridden by explicit instruction. (2) Config path-based rules (like `~/.config/opencode/opencode.json`: deny) are guardrails that CAN be overridden by explicit instruction.
  - **Files**: None
  - **Commands**: Tested SSH execution, tested config self-edit
- **Date**: 2026-05-03
  - **Category**: config
  - **Description**: Installed OpenCode plugins: `opencode-daytona`, `opencode-vibeguard`, `opencode-dynamic-context-pruning`, `opencode-shell-strategy`, `opencode-websearch-cited`, `opencode-supermemory`. Installed MCP servers: `context7` (docs search), `gh_grep` (GitHub code search).
  - **Files**: `~/.config/opencode/opencode.json`
  - **Commands**: None (plugins auto-install on startup)
- **Date**: 2026-05-03
  - **Category**: preference
  - **Description**: User changed memory update policy: ONLY update MEMORY.md when user EXPLICITLY asks. Do not propose updates automatically. Only log important information, not routine tasks.
  - **Files**: `AGENTS.md` (deleted, rule was there)
  - **Commands**: None
- **Date**: 2026-05-03
  - **Category**: infrastructure
  - **Description**: Nginx installed and configured on VPS. Created reverse proxy from `musicsheets.site` to `localhost:5050`. Default site serves welcome page on raw IP. Installed `nginx-extras`. Config files remain on VPS only.
  - **Files**: None (server configs on VPS)
  - **Commands**: `sudo apt install nginx nginx-extras`, `sudo nginx -t`, `sudo systemctl reload nginx`
- **Date**: 2026-05-03
  - **Category**: infrastructure
  - **Description**: SSL configured via Let's Encrypt (Certbot) for `musicsheets.site` and `www.musicsheets.site`. Auto-renewal enabled. Nginx configured to redirect HTTP to HTTPS. Cloudflare SSL/TLS mode set to **Full (Strict)**. SSL certs remain on VPS only.
  - **Files**: None (server certs on VPS)
  - **Commands**: `sudo apt install certbot python3-certbot-nginx`, `sudo certbot --nginx`
- **Date**: 2026-05-03
  - **Category**: config
  - **Description**: Removed `opencode-daytona` plugin from `~/.config/opencode/opencode.json`. The plugin was breaking all bash commands with `DAYTONA_API_KEY` errors and redirecting to an empty sandbox instead of the local project folder. Added `DAYTONA_API_KEY` to `~/.zshrc` but plugin is disabled for now.
  - **Files**: `~/.config/opencode/opencode.json`
  - **Commands**: `sed -i '' '/opencode-daytona/d' ~/.config/opencode/opencode.json`
- **Date**: 2026-05-03
  - **Category**: config
  - **Description**: Restored `AGENTS.md` in project root. Updated security rules: `rm` commands set to `ask` (previously `deny`) to allow file management inside project folder. Infrastructure-level `ssh*` and `sudo rm*` blocks remain absolute.
  - **Files**: `AGENTS.md`, `~/.config/opencode/opencode.json`
  - **Commands**: None
- **Date**: 2026-05-09
  - **Category**: infrastructure
  - **Description**: **HALLUCINATION CORRECTED 2026-05-17.** Original plan for Cloudflare tunnel + Workers.dev backup was based on false AI claims. Deploy pipeline COMPLETED. GitHub push → webhook HMAC-validated → deploy.sh with flock lock → git pull → npm install --include=dev → react-scripts build → pm2 reload. Maintenance mode via flag file (/tmp), serves dark UI with live logs + IST clock + copy button. Express routes: POST /api/webhook, GET /api/health. Server.js middleware serves maintenance page during deploys (keeps webhook open). Security: HMAC-SHA256 validation using WEBHOOK_SECRET from .env. Fixed concurrent deploy log wipe (flock before log init). Fixed missing devDeps in production build (--include=dev). Deploy.sh uses dynamic repo path from Express. No hardcoded VPS paths in repo.
  - **Files**: `server.js`, `ops/scripts/deploy.sh`, `ops/maintenance/index.html`, `docs/deployment.md`
  - **Commands**: None
- **Date**: 2026-05-17
  - **Category**: hallucination
  - **Description**: **AI agent (DeepSeek V4 via OpenCode) hallucinated false claims about Cloudflare tunnels.** Claimed: (1) named tunnels get free permanent `*.cfargotunnel.com` URL — FALSE, needs domain for hostname in Zero Trust. (2) quick tunnel URLs are permanent — FALSE, random on every restart. (3) Workers can reach tunnels without hostname — UNVERIFIED/likely false. Cloudflared was installed on VPS, tunnel created (musicsheets, UUID 47088571-...a4d60), connected successfully to Cloudflare edge. But without `musicsheets.site` in Cloudflare account, no public URL resolves. Tunnel technically works but is unreachable without a domain. Pivoting to Tailscale Funnel (free, permanent, machine-identity-based URL).
  - **Files**: `docs/deployment.md`, `docs/hallucinations.md`
  - **Commands**: `cloudflared tunnel login`, `cloudflared tunnel create musicsheets`, `cloudflared tunnel run --url http://localhost:5050 musicsheets`
- **Date**: 2026-05-17
  - **Category**: preference
  - **Description**: Read permission fix applied. Removed `read: "*": "ask"` catch-all from global config. Read within workspace now defaults to `allow`. `external_directory` controls access outside workspace. Pattern matching for `read` uses relative paths against workspace root, not absolute paths — this was why the absolute path pattern never matched.
  - **Files**: `~/.config/opencode/opencode.json`

## Notes
<!-- Add any other persistent notes, links, or reminders here -->
- Check docs/hallucinations.md when correcting past mistakes
- Update docs/deployment.md when infrastructure changes
- VPS providers in use: Oracle Cloud e2.micro (primary - musicsheets.site), Hostinger (secondary), may add more
- Goal: never lose access to the app — multiple free Cloudflare backup URLs + GitHub Pages + Firebase hosting as fallback layers
