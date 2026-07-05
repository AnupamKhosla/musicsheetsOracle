# Architecture Decisions

## Store XML in MongoDB (gzip-compressed)

**Decision**: Store MusicXML content as gzip-compressed Binary in MongoDB
instead of serving from static files.

**Rationale**:
- Single source of truth — no file sync between VPS and local
- Atomic backups — dump the DB, get everything
- No git bloat from hundreds of XML files
- Still SSR-friendly — API decompresses and returns XML as JSON string

## No Base64 Encoding

**Decision**: Store gzip bytes as MongoDB `Binary` type, not base64 string.

**Rationale**: MongoDB natively supports Binary data. Base64 would add ~33%
storage overhead and require decode on read. API decompresses to plain XML
string for JSON responses — the compression layer is invisible to the frontend.

## Server-Side Decompress (Not Browser)

**Decision**: API decompresses `xmlGz` before returning JSON. Frontend receives
plain XML string.

**Rationale**:
- SSR works naturally — server-rendered page gets XML content immediately
- No additional JS library needed in browser (no pako)
- Simpler frontend code — just replace URL with string

## Next.js SSR (Not ISR)

**Decision**: Default Next.js SSR without explicit ISR or SSG configuration.

**Rationale**:
- Cache headers and VPS resources handle performance
- ISR could be added later per-sheet if needed
- Keeps setup minimal

## Synthesized Audio (Not Sampled)

**Decision**: Use Tone.js `PolySynth` instead of `Sampler` with piano samples.

**Rationale**:
- Zero network requests (no 8MB piano sample downloads)
- Instant playback, no buffer-loading race conditions
- Works even when the user has no credits on external APIs
- Harmonium/piano samples can be added later by swapping the synth backend

## No Separate Lyrics Extraction

**Decision**: Lyrics stay inside the compressed XML. Frontend extracts them
from `xmlContent` via `parseMusicXMLString()`.

**Rationale**:
- Avoids schema complexity — lyrics are derived data
- Always consistent with the XML
- Small parsing cost on first load only
- "No lyrics available" shown when the lyrics array is empty

## Jekyll Docs (Not Docsify, Not Next.js Route)

**Decision**: GitHub Pages + Jekyll for project documentation.

**Rationale**:
- Zero hosting cost (GitHub Pages)
- GitHub auto-builds on push
- Pure HTML output — no JS needed, fast, SEO-friendly
- Runs locally for offline reading
- Separate from the app — docs don't affect builds or bundle
