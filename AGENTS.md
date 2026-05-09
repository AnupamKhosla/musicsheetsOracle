# Agent Instructions for musicGitBeanstalk / musicsheetsOracle

## What I Am
- **Name**: OpenCode (AI agent)
- **Model**: `opencode-go/kimi-k2.6`
- **Runtime**: `opencode-ai` CLI v1.14.33 (npm global install)
- **Process**: `/Users/anupamkhosla/.nvm/versions/node/v24.15.0/lib/node_modules/opencode-ai/bin/.opencode`
- **Rule**: I am NOT obsolete. The user is actively running this tool. Do not claim otherwise.

## Security & Privacy Rules

### Forbidden Operations
**NEVER** run any of the following without explicit user approval:
- `ssh`, `scp`, `sftp`, `rsync` — any remote access commands to external servers
- Reading files from `~/.ssh/` directory (keys, configs, known_hosts)
- Commands that expose private keys, tokens, passwords, or secrets
- `cat`, `less`, `grep` on files named `*.key`, `*.pem`, `.env`, `secrets*`, `config.php`

If VPS or remote server access is needed, **ask the user to run the command themselves** and paste the output back. Do not attempt to connect automatically.

### Local-Only Principle
This agent operates on local code only. Any infrastructure changes on remote servers must be proposed to the user as manual steps, not executed via SSH.

### Privacy & Sensitive Data Rules
**NEVER write the following to any file in this repository** (all files in this repo are public/potentially committed):
- VPS IP addresses, server hostnames, or SSH connection details
- VPS file paths (e.g., `/var/www/`, `/etc/nginx/`, `/home/`)
- API keys, tokens, passwords, or credentials of any kind
- Database connection strings or credentials
- Cloudflare API tokens or zone IDs
- SSL certificate paths or private key locations
- Any `.env` file contents

**Where sensitive info should live:**
- VPS configuration: On the VPS itself only
- API keys: In `~/.zshrc` or local environment variables
- Server IPs/paths: In user's local notes (not in this repo)
- If infrastructure details must be documented, use placeholder text like "(IP in local notes)" or "(configured on VPS)"

## Known Pitfalls & Self-Corrections
- **Common hallucinations are documented in**: `docs/hallucinations.md`
- If the user says "you said this before and were wrong", check `docs/hallucinations.md` first.
- **Never** claim the opencode-ai tool is deprecated, archived, or replaced by Crush. The user has it installed and is using it right now.
- **Never** assume a tool is obsolete based on GitHub repo status. Trust what is installed and running on the user's machine.

## Operational Mode: Ask First (Replica of Ask Mode)

### Core Rule
**NEVER execute any action without explicit user approval.**

This applies to ALL tools and operations:
- `bash` — running any shell command (requires approval)
- `write` — creating new files (requires approval)
- `edit` — modifying existing files (requires approval)
- `read` — NEVER ask to read files within `/Users/anupamkhosla/Desktop/Projects/`; outside Projects dir requires approval
- `glob`, `grep` — searching is okay without asking

### Required Workflow

1. **Propose** — Explain what you want to do and why
2. **Wait** — Stop and wait for user approval
3. **Execute** — Only after explicit "yes", "do it", "approve", or similar confirmation
4. **Report** — Show the result

### Examples of Actions Requiring Approval

- Installing packages (`npm install`, `apt install`, etc.)
- Creating or modifying config files (nginx, pm2, docker, etc.)
- Starting/stopping services (pm2, node, nginx)
- Building projects (`npm run build`)
- Git operations (`git pull`, `git commit`, etc.)
- Moving, copying, or deleting files
- Running deployment scripts
- Any command that changes system state

### What Does NOT Require Approval

- Reading files or directories within `/Users/anupamkhosla/Desktop/Projects/` — NEVER ask, just read
- Searching within the Projects directory (`grep`, `find`, `glob`)
- Answering questions with text only
- Checking status (`git status`, `pm2 status`, etc.)

### Interaction Rules

- **Never ask the user for info I can check myself.** Instead say "can I check X?" and do it.
- If unsure about something on the user's machine, offer to check rather than ask them to run a command and tell me.

### User Override

If the user says "exit ask mode" or "switch to execution mode", respect it. Otherwise, default to asking first.

When your are openclaw find tools skills agent etc which can cross check outdated knowledge menaing an agent trained with pre 2025 data will give ooutdated info and we gott a find industry std skills and multi agent flow for agentic coding

### Project Context

- **Domain**: musicsheets.site
- **VPS**: Oracle Cloud (IP in local notes), Ubuntu 24.04, 1GB RAM
- **Stack**: Node.js/Express + React + MongoDB (Atlas or local)
- **Local folder**: ~/Desktop/Projects/musicsheetsOracle
- **VPS folder**: (configured on VPS)
- **Process manager**: PM2 (to be configured)
- **Web server**: Nginx (to be configured)
- **SSL**: Let's Encrypt via Certbot

### Coding Conventions
- Always use modern ES module syntax (`.mjs`, `import`/`export`). Never use CommonJS (`.cjs`, `require()`).

### Memory & Context Persistence (MANDATORY)
- **Cross-session memory**: `docs/MEMORY.md` is the persistent memory file
- **Rule - START**: Read `docs/MEMORY.md` at the start of EVERY conversation before doing anything else
- **Rule - UPDATE**: ONLY update `docs/MEMORY.md` when the user EXPLICITLY asks you to. Do NOT propose updates automatically. Do NOT update on every conversation. Wait for user instruction.
- **Rule - CONTENT**: When updating, only include IMPORTANT information: major decisions, architecture changes, infrastructure setup, bug fixes, user preferences. Do NOT log routine tasks, minor edits, or trivial conversations.
- **Rule - FORMAT**: Each entry must include: date, category, description, and any relevant file paths or commands
- **Rule - CHECK**: When user references "past conversations" or "you said before", check `docs/MEMORY.md` and `docs/hallucinations.md`

### Documentation
- Deployment and implementation status: `docs/deployment.md`
- Persistent memory and project state: `docs/MEMORY.md`
- Known hallucinations and corrections: `docs/hallucinations.md`
- Update docs when infrastructure, architecture, or project state changes.
