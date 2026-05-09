#!/usr/bin/env bash
#
# musicsheets deploy script
# Triggered by Express /api/webhook (HMAC validated)
# Covers ALL domains: musicsheets.site, tunnel, workers.dev, pages.dev
#
# Usage: deploy.sh <repo-dir>
#   Express passes its own path.resolve() as $1 — no hardcoded paths in repo
#
# Flow:
#   1. Lock check (prevents concurrent deploys)
#   2. Activate maintenance flag → Express serves maintenance page
#   3. Pipe all output to /tmp/musicsheets-logs.html (live-viewable)
#   4. git pull → npm install → build frontend
#   5. Build FAILS: maintenance stays ON, logs visible forever → SSH to fix
#   6. Build OK: remove flag, pm2 reload
#   7. trap: removes lock on unexpected crash (maintenance flag stays — visible failure)

set -euo pipefail

REPO_DIR="${1:-}"
if [ -z "$REPO_DIR" ] || [ ! -d "$REPO_DIR/.git" ]; then
  echo "ERROR: Invalid repo directory: ${REPO_DIR:-not provided}" >&2
  echo "Usage: deploy.sh <repo-dir>" >&2
  exit 1
fi

MAINT_FLAG="/tmp/musicsheets-maintenance"
LOG_FILE="/tmp/musicsheets-logs.html"
LOCK_FILE="/tmp/musicsheets-deploy.lock"

# --- Lock FIRST (before touching logs or flag) ---
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Deploy already in progress" >&2
  exit 1
fi

# --- Now init logs (only the lock holder reaches here) ---
echo "<pre>Pipeline started at $(date)</pre>" > "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date '+%H:%M:%S')] $1"; }

on_exit() {
  local status=$?
  log "Deploy exiting with status $status"
  if [ $status -ne 0 ]; then
    log ""
    log "========================================="
    log "  DEPLOY FAILED"
    log "  Maintenance mode is ACTIVE"
    log "  Check logs on any domain"
    log "  Fix issue, then remove flag manually:"
    log "    rm -f /tmp/musicsheets-maintenance"
    log "========================================="
  fi
}
trap on_exit EXIT

# Activate maintenance
log "Activating maintenance mode (flag file)"
touch "$MAINT_FLAG"

# Pull + install + build
log "Git pull"
cd "$REPO_DIR"
git pull --ff-only origin master || log "WARN: git pull failed — continuing with existing checkout"

log "Installing dependencies"
npm install

log "Building frontend"
if ! (cd frontend && npm install && npm run build); then
  log "FATAL: Frontend build failed"
  exit 1
fi
cd "$REPO_DIR"

# Success — deactivate maintenance, reload app
log "Build successful — removing maintenance flag"
rm -f "$MAINT_FLAG"

log "Reloading app (zero-downtime)"
pm2 reload ecosystem.config.json

log "Pipeline complete"
echo "<pre>Deploy finished at $(date) — site is live</pre>" >> "$LOG_FILE"
