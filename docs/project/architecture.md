# Architecture

## High-Level Overview

```
Browser → musicsheets.site → Cloudflare DNS → VPS:443 → Nginx → :5050 → Next.js → MongoDB Atlas
```

Next.js handles everything: pages, API routes, static files — all in one process.

## Data Flow

```
MongoDB (musicsheets collection)
  │
  │ GET /api/posts/[id]  →  returns { ..., xmlContent: "..." }  (decompressed server-side)
  │
  ▼
src/app/post/[id]/page.tsx  (server-rendered page)
  │
  ├── MusicSheetViewer (client component)
  │     ├── OSMDWrapper        — Western staff rendering via opensheetmusicdisplay
  │     │                       accepts xmlContent (loadFromData) or file (load)
  │     └── IndianNotation     — Hindustani swara grid (custom React component)
  │                             accepts xmlContent (no URL fetch) or fileUrl
  │
  ├── PlayerControls — Audio engine (Tone.js) plays both views
  └── Lyrics section — Extracted from xmlContent via parseMusicXMLString
```

## Route Map

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/posts` | GET | List sheets (paginated, filterable). Projects out `xmlGz` + `password` |
| `/api/posts` | POST | Create sheet. Accepts `xmlContent`, compresses to `xmlGz` |
| `/api/posts/[id]` | GET | Get sheet detail. Decompresses `xmlGz` → returns `xmlContent` |
| `/api/posts/[id]` | DELETE | Delete sheet (password-protected) |
| `/api/posts/latest` | GET | Latest 6 sheets |
| `/api/posts/count` | GET | Sheet count matching query |
| `/api/webhook` | POST | GitHub auto-deploy hook |
| `/api/health` | GET | Health check |
| `/api/logs` | GET | Deploy pipeline logs |

### Page Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `page.tsx` (server) | Home — search form, example sheet, latest sheets |
| `/post/[id]` | `post/[id]/page.tsx` (client) | Sheet detail — tabs, player, lyrics, delete |
| `/search` | `search/page.tsx` (client) | Search + paginated results |

## Key Libraries

| Library | Purpose |
|---------|---------|
| opensheetmusicdisplay | Western staff rendering (MusicXML → SVG) |
| Tone.js | Audio playback (synthesized, no samples) |
| mongodb | Database driver |
| zlib (built-in) | Server-side gzip compress/decompress |
| react-paginate | Search pagination |

## Directory Layout

```
src/
  app/api/posts/          — API route handlers
  app/post/[id]/          — Sheet detail page
  app/search/             — Search page
  components/             — React components
  lib/
    db.ts                 — MongoDB connection
    compressXml.ts        — gzip compress/decompress helpers
    parseMusicXML.ts      — MusicXML parser (browser DOMParser)
    bhatkhande.ts         — MusicXML → Bhatkhande notation converter
    midi.ts               — Note → MIDI event extraction
    audio.ts              — Tone.js audio engine
    sargam-data.ts        — Swara, taal, raga data tables
    platform.ts           — Runtime platform detection (VPS vs managed)
scripts/                  — Utility scripts (migration, import)
docs/                     — Jekyll documentation site
ops/                      — Nginx config, deploy scripts
public/sheets/            — Legacy static XML files (to be migrated)
public-sheets/            — Raw download cache (gitignored)
```
