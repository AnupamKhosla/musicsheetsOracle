#!/usr/bin/env bash
#
# musicsheets deploy script
# Triggered by Next.js /api/webhook (HMAC validated)
#
# Usage: deploy.sh <repo-dir>
#   Webhook handler passes process.cwd() as $1
#
# Flow:
#   1. Lock check (prevents concurrent deploys)
#   2. Activate maintenance flag → layout.tsx serves maintenance page
#   3. Pipe all output to ops/deploy-logs.html (live-viewable)
#   4. git pull → npm install → next build
#   5. Build FAILS: maintenance stays ON, logs visible forever
#   6. Build OK: remove flag, pm2 reload
#   7. trap: removes lock on unexpected crash

set -euo pipefail

REPO_DIR="${1:-}"
if [ -z "$REPO_DIR" ] || [ ! -d "$REPO_DIR/.git" ]; then
  echo "ERROR: Invalid repo directory: ${REPO_DIR:-not provided}" >&2
  echo "Usage: deploy.sh <repo-dir>" >&2
  exit 1
fi

MAINT_FILE="$REPO_DIR/MAINTENANCE"
LOG_FILE="$REPO_DIR/ops/deploy-logs.html"
LOCK_FILE="$REPO_DIR/ops/deploy-lock"

# --- Lock FIRST (before touching logs or flag) ---
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Deploy already in progress" >&2
  exit 1
fi

# --- Init logs ---
echo "<pre>Pipeline started at $(date)" > "$LOG_FILE"
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
    log "  Fix issue, then:"
    log "    echo '0' > $MAINT_FILE"
    log "========================================="
  fi
}
trap on_exit EXIT

# Activate maintenance
log "Activating maintenance mode"
echo "1" > "$MAINT_FILE"

# Pull + install + build
log "Git pull"
cd "$REPO_DIR"
git pull --ff-only origin master || log "WARN: git pull failed — continuing with existing checkout"

log "Installing dependencies"
npm install --include=dev

log "Building Next.js app"
if ! (npx next build); then
  log "FATAL: Next.js build failed"
  exit 1
fi

# Success — deactivate maintenance, reload app
log "Build successful — removing maintenance flag"
echo "0" > "$MAINT_FILE"

log "Reloading app (zero-downtime)"
pm2 reload ecosystem.config.json

log "Pipeline complete"
echo "Deploy finished at $(date) — site is live</pre>" >> "$LOG_FILE"
