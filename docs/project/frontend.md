# Frontend

## Component Tree

```
Layout (src/app/layout.tsx)
  ├── HomePage (src/app/page.tsx)
  │     ├── SearchForm
  │     ├── MusicSheetViewer        — Example sheet
  │     └── PostSummary[]           — Latest 6 sheets
  │
  ├── PostPage (src/app/post/[id]/page.tsx)
  │     ├── MusicSheetViewer        — Sheet detail
  │     │     ├── OSMDWrapper       — Western staff
  │     │     ├── IndianNotation    — Bhatkhande swara grid
  │     │     └── PlayerControls    — Audio (Tone.js)
  │     └── Lyrics section
  │
  └── SearchPage (src/app/search/page.tsx)
        ├── SearchForm
        └── PostSummary[]           — Paginated results
```

## MusicSheetViewer

The main orchestrator component. Accepts either `fileUrl` (legacy) or `xmlContent` (new).

Props:
```
fileUrl?: string      — URL to static XML file (fallback)
xmlContent?: string   — Raw MusicXML string (preferred, from API)
sheetName?: string    — Display name
```

Priority: `xmlContent` > `fileUrl`. When both provided, `xmlContent` wins.

## OSMDWrapper

Thin wrapper around OpenSheetMusicDisplay.

Props:
```
file?: string              — URL to load (legacy, for osmd.load())
xmlContent?: string         — XML string (new, for osmd.loadFromData())
currentBeat?: number        — Playback beat for cursor sync (-1 = hidden)
autoResize?: boolean        — Fit container width
```

Uses `loadFromData()` when `xmlContent` is provided, otherwise falls back to `load(file)`.

## IndianNotation

Custom React component that renders Hindustani Bhatkhande notation as a swara grid.

Props:
```
fileUrl?: string            — URL to fetch XML from (legacy)
xmlContent?: string          — XML string (new, preferred)
language?: Language          — Devanagari / English / Bangla
currentBeat?: number         — Playback highlight
```

## PlayerControls

Tone.js audio engine. Used by both Western and Indian tabs.

Features:
- Voice picker (sine / triangle / square / sawtooth)
- Tempo control (30-240 BPM)
- Play / Stop / Replay
- Beat callback for cursor sync

## Key Conventions

### Internal Navigation
Use Next.js `<Link>` component always, never `<a>` tags for internal routes.

### MusicXML Parsing
All parsing goes through `src/lib/parseMusicXML.ts` — the single DOMParser-based
parser shared by OSMDWrapper (indirectly), IndianNotation, audio engine, and lyrics.

### Audio
Synthesized via Tone.js PolySynth — no sample loading, zero network, instant playback.
```