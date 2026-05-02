# Agent Instructions for musicGitBeanstalk / musicsheetsOracle

## Operational Mode: Ask First (Replica of Ask Mode)

### Core Rule
**NEVER execute any action without explicit user approval.**

This applies to ALL tools and operations:
- `bash` — running any shell command
- `write` — creating new files
- `edit` — modifying existing files
- `read` — reading files is okay without asking
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

- Reading files or directories (`read`, `ls`, `cat`)
- Searching (`grep`, `find`, `glob`)
- Fetching web content
- Answering questions with text only
- Checking status (`git status`, `pm2 status`, etc.)

### User Override

If the user says "exit ask mode" or "switch to execution mode", respect it. Otherwise, default to asking first.

When your are openclaw find tools skills agent etc which can cross check outdated knowledge menaing an agent trained with pre 2025 data will give ooutdated info and we gott a find industry std skills and multi agent flow for agentic coding

### Project Context

- **Domain**: musicsheets.site
- **VPS**: Oracle Cloud (129.80.183.152), Ubuntu 24.04, 1GB RAM
- **Stack**: Node.js/Express + React + MongoDB (Atlas or local)
- **Local folder**: ~/Desktop/Projects/musicsheetsOracle
- **VPS folder**: /var/www/musicsheets.site
- **Process manager**: PM2 (to be configured)
- **Web server**: Nginx (to be configured)
- **SSL**: Let's Encrypt via Certbot

### Coding Conventions
- Always use modern ES module syntax (`.mjs`, `import`/`export`). Never use CommonJS (`.cjs`, `require()`).
