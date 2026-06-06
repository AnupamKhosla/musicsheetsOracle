# Next.js Migration Handover — 2026-06-06

## What was done

Migrated the entire app from CRA + Express to **Next.js 16.2 + React 19.2**.

### New file structure
```
src/
├── app/
│   ├── layout.tsx              Root layout (nav + footer)
│   ├── page.tsx                Homepage (server component, calls MongoDB directly)
│   ├── post/[id]/page.tsx      Single sheet view (client component)
│   ├── search/page.tsx         Search + pagination (client component)
│   ├── create/page.tsx         Create post (client component)
│   ├── HomeOSMD.tsx            Client wrapper for OSMD on homepage
│   └── api/posts/
│       ├── route.ts            GET (list) + POST
│       ├── [id]/route.ts       GET (single) + DELETE
│       ├── count/route.ts      GET count
│       └── latest/route.ts     GET latest 6
├── components/
│   ├── Navigation.tsx          Top nav with ragas/genres mega-menus
│   ├── SearchForm.tsx          Filter form (song/artist/scale)
│   ├── PostSummary.tsx         Post card
│   ├── OSMDWrapper.tsx         OpenSheetMusicDisplay (client-only)
│   └── IndianNotation.tsx      Bhatkhande notation parser/renderer
├── lib/
│   └── db.ts                   Cached MongoDB connection
├── proxy.ts                    Dev-only HTML beautifier (js-beautify)
├── custom_scss/                Copied from frontend/src/custom_scss/
└── app/globals.scss            Main stylesheet (Tailwind + SCSS)
public/                         Static assets (logo, sheets, img)
next.config.mjs                 Standalone output + serverExternalPackages
tailwind.config.ts              Migrated to TypeScript
tsconfig.json                   Updated for Next.js
postcss.config.mjs              PostCSS config
```

### Old code (untouched, stays as fallback)
- `frontend/` — CRA app
- `server.js` — Express server
- `routes/posts.mjs` — Express routes
- `db/conn.mjs` — Old DB connection

### Key changes
- Package.json now at root level (no more `frontend/package.json` separation)
- All `.js` → `.tsx` with TypeScript
- Home page is server-rendered — fetches MongoDB directly, no `useEffect`/`fetch`
- OSMD loaded via `dynamic(() => import(...), { ssr: false })` — never runs on server
- API routes are Next.js Route Handlers, no Express needed
- HTML prettification via `src/proxy.ts` — dev only, uses `js-beautify`

### To run
```bash
npm install
npm run dev    # starts on port 3000 (or 5050 if 3000 busy)
```

### Vercel deploy
Connect GitHub repo, add `ATLAS_URI` to env vars — zero config needed.

## Known issues

### Navigation needs fixing
The nav menus (Ragas/Genres mega-menus) still use old vanilla JS DOM manipulation in `useEffect`. Issues:
- The `window.onclick` handler may interfere with React's client-side navigation
- Menu toggle on mobile may not close properly on link click
- The SCSS `_topnav.scss` uses CSS hover-based submenu opening which doesn't work well with Next.js client-side routing
- **Recommendation**: Rewrite Navigation as a proper React state-driven component with `useState` for open/closed menus instead of DOM classList

### Old code cleanup needed
The old CRA + Express structure still exists and should be removed once Next.js is stable:
- `frontend/` — entire CRA folder (keep only if you need rollback)
- `server.js` — old Express entry point
- `routes/` — old Express routes
- `db/conn.mjs` — old DB connection
- `loadEnvironment.mjs` — old env loader
- `ops/` — old deployment scripts (webhook, maintenance)
- `ecosystem.config.json` — PM2 config (needs updating for `next start`)
- `tests/` — old mocha tests (need to be rewritten for Next.js)

### Deployment note
- Production build: `npm run build && npm start` → Next.js server on port 5050 (set `PORT=5050`)
- Tailscale funnel still points to port 5050 — works with `next start` as long as `PORT=5050` is set
- PM2 config needs updating: change command to `node .next/standalone/server.js` or `next start`

### Other
- Sass `@import` deprecation warnings — non-blocking but should migrate to `@use` eventually
- `menuActiveRan` singleton removed — React Strict Mode double-renders won't skip `activateMenu` now, but it's still DOM-based
- `loadEnvironment.mjs` still exists but no longer imported by Next.js (uses `dotenv` in `db.ts` directly)
- Some old vendor JS libs not ported (swiper, choices.js, etc.) — weren't actively used
- `menuActiveRan` singleton removed — React Strict Mode double-renders won't skip `activateMenu` now, but it's still DOM-based
- Some old vendor JS libs not ported (swiper, choices.js, etc.) — weren't actively used
- `loadEnvironment.mjs` still exists but no longer imported by Next.js (uses `dotenv` in `db.ts` directly)
