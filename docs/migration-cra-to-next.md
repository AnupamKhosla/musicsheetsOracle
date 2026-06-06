# CRA → Next.js Migration Plan

> Created: 2026-06-06
> Status: Planning phase (not started)

## Current Stack

```
Oracle Cloud VPS (Ubuntu 24.04, 1GB)
├── Express (port 5050) — REST API /api/posts/*
│   └── MongoDB Atlas
├── CRA build (static files) — React 18 app
│   ├── React Router (4 pages)
│   ├── Tailwind CSS 3 + SCSS
│   ├── opensheetmusicdisplay
│   └── IndianNotation (custom)
└── Nginx reverse proxy → port 80/443
```

**4 pages**: Home, Search, Post/:id, Create
**7 components**: Layout, Navigation, Header (unused), SearchForm, PostSummary, OpenSheetMusicDisplay, IndianNotation
**1 API route file**: `routes/posts.mjs` (Express)

## Target Stack

Next.js App Router (latest), one project, one deploy.

| Layer | Before | After |
|-------|--------|-------|
| Framework | CRA 5 (react-scripts) | Next.js (latest) |
| Routing | react-router-dom | App Router (file-based) |
| Server | Express (separate) | Next.js Route Handlers or Server Components |
| Rendering | All CSR | Server Components + Client Components |
| CSS | Tailwind + SCSS | Tailwind + SCSS (same) |
| DB | MongoDB via Express | MongoDB via Server Components or Route Handlers |
| Sheet render | OSMD (client-side) | dynamic() import with ssr:false |

## File Mapping

```
Before                            After
────────────────────────────────────────────────────────
/pages/Home.js                    /app/page.tsx              (ISR)
/pages/Search.js                  /app/search/page.tsx       (CSR)
/pages/Post.js                    /app/post/[id]/page.tsx    (SSG+ISR)
/pages/Create.js                  /app/create/page.tsx       (CSR)

/App.tsx                          /app/layout.tsx
/components/Layout.js             (merged into layout.tsx)
/components/Navigation.js         /components/Navigation.tsx (Client)
/components/OpenSheetMusicDisplay /components/OSMDWrapper.tsx(Client, ssr:false)
/components/IndianNotation.js     /components/IndianNotation.tsx (Client)
/components/PostSummary.js        /components/PostSummary.tsx
/components/SearchForm.js         /components/SearchForm.tsx

/server.js                        /app/api/posts/route.ts etc. (or removed)
/routes/posts.mjs                 → Route Handlers or direct DB in Server Components
/db/conn.mjs                      /lib/db.ts

/styles.scss                      /app/globals.scss (same imports)
/custom_scss/                     kept as-is
/tailwind.config.js               kept as-is

/public/                          /public/ (Next.js static)
/libs/ (vendors)                  → removed (many unused, already on npm)
/partials/ (HTML partials)        → removed (Next.js handles head & scripts natively)

/template.yml                     → removed (old AWS CodeStar)
/buildspec.yml                    → removed or rewritten
/ecosystem.config.json            → updated (change script path)
```

## Migration Steps

### Phase 1: Scaffold Next.js
- `npx create-next-app@latest` in a new directory (or alongside)
- Choose: App Router, TypeScript, Tailwind
- Copy over `tailwind.config.js` and `custom_scss/`

### Phase 2: Port Layout & Pages
- Convert `Layout.js` → `app/layout.tsx` (with footer)
- Convert `Navigation.js` → client component
- Convert Home, Search, Post, Create as page files
- Set up `app/api/posts/` route handlers mirroring Express routes

### Phase 3: Port Components
- OSMD: `dynamic(() => import('./OSMDWrapper'), { ssr: false })`
- IndianNotation: same logic, just move to `.tsx`
- PostSummary, SearchForm: straightforward ports

### Phase 4: Handle Special Dependencies

| Package | Action |
|---------|--------|
| `opensheetmusicdisplay` | dynamic import, client-only |
| `swiper@4.5.0` | upgrade to Swiper 11 or replace with native CSS |
| `choices.js`, `tobii`, `tiny-slider`, `shufflejs` | replace with React equivalents or remove if unused |
| `wow.js`, `jarallax` | replace with CSS animations or Framer Motion |
| `react-paginate` | keep, works in client components |
| `@iconscout/unicons`, `feather-icons` | keep as-is or use `lucide-react` |
| `animate.css` | can keep or use Tailwind animations |

### Phase 5: Deployment
- Set `output: 'standalone'` in `next.config.js`
- Update `ecosystem.config.json`:
  ```json
  { "script": "node .next/standalone/server.js", "port": "3000" }
  ```
- Update Nginx to proxy to port 3000 instead of 5050
- Remove Express `server.js` and `routes/` after verifying API routes work

## Open Decisions

1. **API approach**: Keep Express REST API and point Next.js to it? Or migrate into Next.js Route Handlers? (Recommended: Route Handlers for single process)

2. **Server Components**: Should page-load data (e.g. latest posts on Home) use Server Components that call MongoDB directly (eliminating REST boilerplate)? (Recommended: yes)

3. **File extensions**: Keep `.js` or full `.tsx` migration? (Recommended: `.tsx` since TypeScript is already set up)

4. **Vendor libs**: Trim unused ones during migration or keep everything?

5. **Deployment order**: Big-bang rewrite or incremental? (Incremental is difficult since CRA and Next.js can't coexist easily)

## Dependencies Requiring Special Handling

Listed above under Phase 4. The main concern is `opensheetmusicdisplay` must never render on the server — it uses canvas/DOM APIs directly. The `dynamic()` import with `ssr: false` handles this.
