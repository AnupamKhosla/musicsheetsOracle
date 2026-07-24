# Persistent Memory for OpenCode Conversations

## Current State
- **Last Updated**: 2026-07-24
- **Summary**: DB storage unified to canonical gzip Binary. Homepage redesigned (bento grid, live player, no bg image). Two-tier nav (raga strip + search filters). Player tab-switch highlight bug fixed. 284/285 sheets verified correct format, 1 re-imported.

## Pending / Next Steps
- [ ] **Chinese sheets → English**: 6 sheets still have Chinese names/lyrics (夜上海, 百鳥和鳴, 花好月圓, 郊游, 甜蜜蜜, 知心客). Need English names + translated lyrics in DB.
- [ ] **Assign correct ragas/genres**: Many sheets have `scale: 'C'` and `Genres: 'Classical'` — need proper raga/genre assignment.
- [ ] **Fetch Indian raga-based public sheets**: Find free MusicXML of Indian compositions, upload to DB with lyrics.
- [ ] **SEO / indexing**: 52 duplicate pages without canonical, 15 404s, 2 5xx. Add canonical tags, sitemap, fix redirects.
- [ ] **Deploy pipeline broken**: `ops/scripts/deploy.sh` still references `react-scripts build` (CRA-era). Needs update to `next build`. VPS must be updated manually until fixed.
- [ ] **Sample DBs**: Drop `sample_*` from Atlas (needs Atlas UI — app user lacks dropDatabase permission).
- [ ] **Dark mode toggle**: Planned for later. Currently light-only.
- [ ] **`/notation-guide` page**: Documented Bhatkhande system for users.
- [ ] **Conversion logic audit**: Chords, same-note, cross-beat holds — basic checks pass, needs human verification by playing multiple sheets.

## Recent Decisions
- **DB canonical format**: Raw gzip bytes in MongoDB `Binary`. `compressXml()` returns `Buffer`, not base64 string. `decompressXmlFromDb()` handles gzip/MXL/base64/plain XML with magic-byte detection.
- **Schema validation**: MongoDB `$jsonSchema` on `musicsheets` collection — `sheetName` required, `xmlGz` must be `binData`. `validationAction: 'warn'` (non-blocking).
- **`password` field removed**: Per-sheet password was dead code. Delete auth uses `process.env.DELETE_KEY`. Future: separate `admins` collection if multi-admin needed.
- **Homepage**: Bento grid, functional-first, no stock images. CSS staff-line ambient bg. Light theme. Sargam motif strip. Live SideBySideViewer as opener.
- **Navigation**: Two-tier — tier 1 = raga/genre chips (primary), tier 2 = search with filters (song, artist, raga select, genre select).
- **Player fix**: Removed `setCurrentBeat(-1)` on tab switch. Both Western/Indian views stay mounted (CSS display toggle) so playback highlight persists across tabs.
- Using PM2 for process management
- Using Nginx as reverse proxy (configured and deployed)
- Using Let's Encrypt for SSL (installed, auto-renewing)
- Using Cloudflare DNS + Full (Strict) SSL mode
- Welcome page on VPS IP, app served on domain
- Disabled `opencode-daytona` plugin (sandbox isolation issues)
- `rm` set to `ask` instead of `deny` for project file management
- **Bhatkhande renderer**: monophonic standard + chord-combo [OURS]. One sub-row per beat cell, simultaneous notes merge into one combo glyph with subtle tint. Smile-bracket `⌣` under held-note reps within a beat. Meend arc `⌒` above between adjacent single-note combos under slur. No cross-beat edge markers. Default sargam = English (Devanagari combining marks confuse browsers).
- **MusicXML `<alter>`** is authoritative — do NOT add `keyAlter[step]` on top (double-counts, breaks F# in D major → renders as Ma instead of Ga).

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
- **Date**: 2026-05-23
  - **Category**: infrastructure
  - **Description**: Tailscale Funnel fully configured and tested. Backup URL: `https://musicsheets.tail0c6a25.ts.net`. Funnel moved through Nginx: added `listen 127.0.0.1:8080` + `musicsheets.tail0c6a25.ts.net` to existing Nginx config, so funnel traffic gets Nginx rate limiting (planned). Tailscale CLI v1.52 syntax change noted: new format `tailscale funnel --https=443 <target> [off]` instead of positional args. 
    PM2 startup fixed: `sudo pm2 startup` was creating root service (`pm2-root.service` reading `/root/.pm2/`) but `pm2 save` writes to `/home/ubuntu/.pm2/`. Re-run `pm2 startup` as ubuntu user (no sudo) to match. 
    Cert files in `/home/ubuntu/` deleted (local copies of funnel cert, not needed). 
    README.md rewritten for non-technical audience: open-source music sheets project, seeking contributors for sheets, Bhatkande notation system, sheet music player plugin, hosting support. CONTRIBUTING.md created with full VPS setup/migration guide (no secrets). 
    Pre-commit hook: `.githooks/pre-commit` with gitleaks, `core.hooksPath` set. 
    Rate limiting NOT yet implemented (planned: Nginx `limit_req_zone` + Express `express-rate-limit`).
  - **Files**: `README.md`, `CONTRIBUTING.md`, `docs/deployment.md`, `docs/MEMORY.md`, `.githooks/pre-commit`, `ecosystem.config.json`
  - **VPS files changed**: `/etc/nginx/sites-available/musicsheets.site`
  - **Commands**: `tailscale funnel --https=443 localhost:5050 off`, `tailscale funnel --bg --https=443 localhost:8080`, `pm2 startup`, `pm2 start ecosystem.config.json`, `pm2 save`, `brew install gitleaks`, `git config core.hooksPath .githooks`
  - **Key lesson**: Tailscale funnel CLI changed in v1.52. Always use `--https=443 <target>` syntax. Funnel only allows public ports 443/8443/10000. Old syntax (`tailscale funnel 5050`) deprecated.

- **Date**: 2026-07-18
  - **Category**: code
  - **Description**: Bhatkhande converter rewrite — replaced interval-partition (which stacked chord notes vertically, reaching 8 sub-rows/cell on Estrellita) with chord-combo algorithm: one sub-row per beat cell, simultaneous notes merge into one horizontal combo glyph. Replaced `crossBeatHold: string[][][]` (vertical edge bars user disliked) with `chordLinks: boolean[][][]` (rose-tint background on chord combos). Smile-bracket `⌣` under same-combo reps for held notes. Meend arc `⌒` between adjacent single-note combos under slur. Renderer (IndianNotation.tsx) and SCSS (_bhatkhande.scss) updated in lockstep.
  - **Files**: `src/lib/bhatkhande.ts`, `src/components/IndianNotation.tsx`, `src/custom_scss/pages/_bhatkhande.scss`, `src/app/post/[id]/page.tsx`, `docs/notation-spec.md`
  - **Commands**: `npx tsc --noEmit` (clean), `npx tsx tmp/verify_chord_combo.mts` (PASS), `npx tsx tmp/verify_brahms.mts` (PASS)
- **Date**: 2026-07-18
  - **Category**: bug
  - **Description**: Three converter bugs fixed:
    1. `noteSemitone()` double-counted key signature: `step + alter + keyAlter[step]`. MusicXML `<alter>` is authoritative when non-zero (verified: F#5 and C#5 in D-major Brahms violin part carry explicit `<alter>1</alter>`). F#5 in D major computed as Ma instead of Ga. Same bug in `processVoice()`'s inline `totalAlter`. Both fixed: use `n.alter` when non-zero, else `keyAlter[step]` fallback.
    2. `.bhatkhande-chord::before` drew 2px top bar on every chord span; adjacent chord reps visually merged into a continuous horizontal line across the row (looked like a spurious grid rule). Removed `::before`, kept only subtle rose tint.
    3. Default sargam changed from Hindi to English (Devanagari combining marks — anudatta, saptak dot, anusvara — stack ambiguously across browsers).
  - **Files**: `src/lib/bhatkhande.ts` (noteSemitone + processVoice), `src/custom_scss/pages/_bhatkhande.scss` (chord class), `src/components/IndianNotation.tsx` (default language)
- **Date**: 2026-07-18
  - **Category**: research
  - **Description**: raag-hindustani.com sitemap (62 URLs) + Notes.html fetched. Confirms our `S r R g G m M P d D n N` notation ID system, Sa/Pa achala, movable do, 10 thaats heptatonic. Saptak convention differs (they use quotes `'S`/`S'`, we use dot below + chandrabindu Devanagari markers). Citation added to `docs/notation-spec.md` §3.6.
  - **Files**: `docs/notation-spec.md`
  - **Commands**: `webfetch https://raag-hindustani.com/sitemap.xml`, `webfetch https://raag-hindustani.com/Notes.html`
- **Date**: 2026-07-18
  - **Category**: bug
  - **Description**: `npm run lint` broken — `next lint` fails with "Invalid project directory provided, no such directory: .../musicsheetsOracle/lint". Looks like a `next` v16 invocation issue. Not fixed; investigation pending.
- **Date**: 2026-07-18
  - **Category**: bug
  - **Description**: **Cross-beat hold bracket missing (Kenek-kenek Ode /post/6a49f36e32c43ef5e06381d7)**. User: "the last S R — last two R were connected without hand, but your algo didn't put bottom smiley bracket and your bracket is not spanning multiple beat blocks". Root cause: the previous cross-beat hold implementation (vertical edge bars on cell borders) was removed entirely as part of the chord-combo rewrite, leaving no mechanism to mark a held note that spans multiple beats. Within-beat holds work (single `NoteInstance` with `reps > 1`), but cross-beat holds across separate `<note>` elements with the same pitch (e.g. three C notes dur=2 each in Kenek beats 13/14/15) silently drop because each becomes its own instance with no link to its neighbour. Same pitch + adjacent time range should collapse into one logical held instance, with the smiley bracket `⌣` visually continuing across cell boundaries. Not yet fixed — documented in `docs/notation-spec.md` §4.3.
  - **Files**: `docs/notation-spec.md`
  - **Test sheet**: `/post/6a49f36e32c43ef5e06381d7` (Kenek-kenek Ode); notes 56-58 = three C notes dur=2 spanning beats 13/14/15 of row 5

- **Date**: 2026-07-19
  - **Category**: code
  - **Description**: Major converter + player fixes (commit `3a17a74`):
    1. **Saptak calculation**: replaced `saptakForOctave(noteOctave, saOctave)` with `saptakForMidi(noteMidi, saMidi)`. Old code compared Western octave numbers — WRONG because Indian saptak boundaries are at Sa, not at C. New code uses absolute MIDI distance: diff<0 → mandra, 0≤diff<12 → madhya, diff≥12 → taar.
    2. **Saptak markers**: replaced `\u0902` (Devanagari Anusvara — a SPACING character that renders as separate "0" glyph after Latin letters) with `\u0307` (COMBINING DOT ABOVE — attaches to any base glyph). Fixes "S0" rendering bug.
    3. **Unison dedup**: when multiple voices play identical pitch at identical time (same midi+startDiv+endDiv), collapse to single instance. Prevents "SS" stacking on multi-voice unison scores (e.g. National Anthem voices 1+5). Applied in both `bhatkhande.ts` (visual) and `midi.ts` (audio).
    4. **Cross-beat holds**: implemented `crossBeatHolds: boolean[]` per DisplayRow. Detects NoteInstances spanning beat boundaries, marks both cells. Renderer draws teal smiley bracket across cell borders (start/middle/end CSS variants).
    5. **Pause/resume**: fixed missing `* 1000` in `startBeatTracking` — `performance.now()` is milliseconds but offset was computed in seconds.
    6. **Chord combo font**: reduced 25% (1.35rem → 1.01rem) for compact multi-note display.
    7. **midi.ts pitchToMidi**: fixed double-counting keyAlter (same bug as bhatkhande.ts noteSemitone, was never fixed here).
    8. **Homepage**: new `SideBySideViewer` component — shows Western + Indian side by side with shared player. Uses client-side fetch from `/api/posts/:id` (avoids RSC serialization issue with large XML strings). Currently shows "Jabase tumsana laagali" (Raag Bhupali).
    9. **@locator/runtime**: dev-only source locator overlay (Option+click → source file).
  - **Files**: `src/lib/bhatkhande.ts`, `src/lib/sargam-data.ts`, `src/lib/midi.ts`, `src/components/IndianNotation.tsx`, `src/components/PlayerControls.tsx`, `src/components/SideBySideViewer.tsx`, `src/components/LocatorDev.tsx`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/custom_scss/pages/_bhatkhande.scss`, `docs/bhatkhande-conversion.md`
  - **Commands**: `npx tsc --noEmit` (clean)

- **Date**: 2026-07-19
  - **Category**: bug
  - **Description**: **DB storage format inconsistency**. Some sheets have `xmlGz` stored as gzip(base64) — works with `decompressXml()`. Others (e.g. `6a49f280d84ae812a3c3b43d` RaagBhupali_JabseTumSan) are stored as raw MXL (ZIP, magic `PK\x03\x04`) or gzip(MXL). The API route (`/api/posts/[id]`) only calls `decompressXml` (gzip-only) → returns garbage for MXL sheets. Client-side `loadMusicXmlFromUrl` in `parseMusicXML.ts` DOES handle MXL via JSZip, but the API doesn't. Fix pending: API route needs magic-byte detection (gzip vs ZIP) before decompressing. Documented in `docs/bhatkhande-conversion.md` §11.
  - **Files**: `src/app/api/posts/[id]/route.ts` (needs fix), `docs/bhatkhande-conversion.md`
  - **Affected sheets**: `6a49f280d84ae812a3c3b43d` (MXL format), possibly others from bulk import
  - **Working sheets**: `64e4265638531e36b92b5f9b` (National Anthem, gzip), `64e42a8b38531e36b92b5f9d` (Jabase, gzip)

- **Date**: 2026-07-19
  - **Category**: decision
  - **Description**: **Future architecture decisions documented**:
    1. SSR: Move XML decompression + Bhatkhande conversion to server component. Pass only `NotationData` JSON to client (small, serializable). Eliminates client fetch round-trip.
    2. Backend-hosted conversion (IP protection): Move `bhatkhande.ts` + `sargam-data.ts` + `parseMusicXML.ts` to private backend API. Client sends MusicXML → backend returns NotationData JSON. Algorithm never reaches browser bundle.
    3. RSC limitation: Next.js RSC cannot serialize large XML strings as server→client props (becomes broken `$a0` reference). Client components MUST fetch XML via API route.
  - **Files**: `docs/bhatkhande-conversion.md` §11

- **Date**: 2026-07-19
  - **Category**: code
  - **Description**: DB cleanup: deleted 7 NO-XML ghost entries (duplicates without content). Renamed 6 Chinese-named sheets to English (夜上海→Night Shanghai, 百鳥和鳴→Birds Singing in Harmony, 花好月圓→Blooming Flowers Full Moon, 郊游→Country Outing, 甜蜜蜜→Sweet as Honey, 知心客→The Understanding Guest). Lyrics still in Chinese — needs translation or re-import.
  - **Files**: `tmp/db-cleanup.mjs` (script)

- **Date**: 2026-07-24
  - **Category**: code
  - **Description**: Major session — DB format unification + homepage redesign + player fix:
    1. **DB storage unified**: `compressXml()` now returns raw gzip `Buffer`. New `decompressXmlFromDb()` with magic-byte detection (gzip/MXL/base64/plain XML). POST route validates MusicXML before accepting. All 285 sheets verified — 284 already correct, 1 (RaagBhupali) re-imported from local `.mxl`.
    2. **Schema validation**: MongoDB `$jsonSchema` on `musicsheets` — `sheetName` required string, `xmlGz` must be `binData`. `password` field removed entirely (was dead code; delete auth uses `DELETE_KEY` env var).
    3. **Player tab-switch bug fixed**: Removed `setCurrentBeat(-1)` on notation change. Both Western/Indian views now stay mounted (CSS `display` toggle instead of conditional render) — playback highlight persists across tabs.
    4. **Homepage redesigned**: Bento grid layout, live SideBySideViewer as opener, sargam motif strip, raga quick-chips, stats, genre links. No background images. CSS staff-line ambient pattern. Light theme.
    5. **Navigation rebuilt**: Two-tier — tier 1 = scrollable raga chips + genre dropdown (primary), tier 2 = search with filters (song, artist, raga select, genre select) + contribute.
    6. **SearchForm stripped**: Removed `sheet_bg.jpg` hero. Compact filter card with raga/genre selects.
    7. **AGENTS.md updated**: New session-tracking rules — proactive MEMORY.md updates at natural breakpoints, `## Pending / Next Steps` section mandatory.
  - **Files**: `src/lib/compressXml.ts`, `src/lib/catalog.ts`, `src/lib/db.ts`, `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`, `src/app/page.tsx`, `src/components/Navigation.tsx`, `src/components/SearchForm.tsx`, `src/components/MusicSheetViewer.tsx`, `src/custom_scss/pages/_home.scss`, `src/app/globals.scss`, `tmp/migrate-fix-format.mjs`, `tmp/drop-sample-dbs.mjs`, `AGENTS.md`, `docs/MEMORY.md`
  - **Commands**: `node tmp/migrate-fix-format.mjs` (284 ok, 1 fixed), `npx tsc --noEmit` (clean), dev server verified on localhost:3000

## Notes
<!-- Add any other persistent notes, links, or reminders here -->
- Check docs/hallucinations.md when correcting past mistakes
- Update docs/deployment.md when infrastructure changes
- VPS providers in use: Oracle Cloud e2.micro (primary - musicsheets.site), Hostinger (secondary), may add more
- Goal: never lose access to the app — multiple free Cloudflare backup URLs + GitHub Pages + Firebase hosting as fallback layers
- **DEPLOY PIPELINE BROKEN (2026-07-19)**: Live site at musicsheets.site is either not updating from git push, or is always one commit behind. The GitHub webhook → `ops/scripts/deploy.sh` pipeline (HMAC-validated, flock-locked, pm2 reload) is suspected broken after the CRA→Next.js migration. The webhook route exists at `src/app/api/webhook/route.ts` and calls `ops/scripts/deploy.sh`, but the deploy script still references `react-scripts build` (CRA-era) instead of `next build`. Needs investigation: (1) verify webhook fires on push, (2) update deploy.sh for Next.js build, (3) confirm pm2 ecosystem.config.json runs `next start` not `react-scripts start`. Until fixed, VPS must be updated manually via `git pull && npm run build && pm2 reload all`.
