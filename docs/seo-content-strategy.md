# SEO & Content Strategy

> Created: 2026-06-06
> Status: Planning phase

## Table of Contents
1. [XML Storage Strategy](#1-xml-storage-strategy)
2. [Free Music Sheet Sources](#2-free-music-sheet-sources)
3. [SEO: SPA vs SSR](#3-seo-spa-vs-ssr)
4. [Content Below Sheets](#4-content-below-sheets)
5. [Ad Monetization](#5-ad-monetization)
6. [Verification Strategy](#6-verification-strategy)

---

## 1. XML Storage Strategy

### Current Storage

| What | Where | How |
|------|-------|-----|
| Metadata (title, artist, genre, scale, date) | **MongoDB** → `musicsheets` collection | `{ sheetName, Artist, Genres, scale, date }` |
| Actual MusicXML content | **Filesystem** → `frontend/public/sheets/{filename}` | Raw `.xml` files served as static assets |
| How Post page loads it | `GET /sheets/{sheetName}` → Express serves static file | Fetched client-side by OSMD and IndianNotation |

### Problems

- **No consistency** — XML file could be deleted but DB entry remains (or vice versa)
- **New sheets need a deploy** — adding `.xml` to `public/sheets/` requires rebuilding CRA or rsyncing to VPS separately
- **No query on content** — can't search by notes, raga, or musical content
- **No versioning** — can't track revisions of a MusicXML file
- **Backup split** — metadata in Atlas, files on VPS disk

### Recommendation: Store XML in MongoDB (gzipped)

**MongoDB's guidance:**
> "If your files are all smaller than the 16 MiB BSON Document Size limit, consider storing each file in a single document instead of using GridFS."

All MusicXML files are well under 16MB. GridFS is overkill.

| Approach | Best for | Space (canon_in_d) |
|----------|----------|-------------------|
| **Store as plain string** (`musicXml`) | Simplicity, direct access | ~700KB |
| **Store as gzipped `Buffer`** (`musicXmlGzip`) | Space savings | ~100KB (7× smaller) |
| **GridFS** | Files > 16MB | Overkill |

**Recommended: gzip on write, gunzip on read.**

```
On upload:
  doc.musicXmlGzip = zlib.gzipSync(xmlString)   // Buffer

On read (via API):
  const xml = zlib.gunzipSync(doc.musicXmlGzip).toString()
```

**Storage estimate:** 1000 sheets × 100KB = ~100MB. Well within Atlas M0 (512MB) or M2 (2GB).

**No industry standard** for storing MusicXML — most platforms (MuseScore, Flat.io) store as S3 objects or compressed text in DB. The latter is simpler for your scale.

---

## 2. Free Music Sheet Sources

### Western Classical (Public Domain)

| Source | Format | Count | How to Use |
|--------|--------|-------|------------|
| **MuseScore.com** | MusicXML (.mxl/.xml) | Millions | API for public CC-licensed scores. Filter by license = "Public Domain" or "CC-BY". |
| **OpenScore** | MusicXML | ~200 | GitHub: `openscore/` project. High-quality classical transcriptions. |
| **IMSLP** | Mostly PDF | Huge | Limited MusicXML. Use Audiveris or other OMR to convert PDF → MusicXML. |
| **Mutopia Project** | LilyPond | 2,100+ | Convert LilyPond → MusicXML via `lilypond --backend=xml`. All public domain. |
| **KernScores (Stanford)** | Humdrum `.krn` | 100,000+ | Convert via Humdrum toolkit: `hum2xml` or `hum2midi` → MusicXML. Research quality. |

### Indian Classical

| Source | Format | Notes |
|--------|--------|-------|
| **No public Indian classical MusicXML library exists** | — | **Opportunity**: your site can be the first. |
| **MuseScore** (user-created) | Occasional Indian raga sheets | Search "raga" or "bhatkhande" on MuseScore.com |
| **Compose in MuseScore** | Export as MusicXML | Create raga aroh/avroh + bandishes in MuseScore. ~50 ragas = unique content. |
| **LLM generation** | MusicXML via AI | Claude/GPT-4 can generate valid MusicXML for simple melodies given a raga description. |

### Content Acquisition Strategy

1. **Scrape MuseScore.com** (public CC-licensed scores only) → western classical, bulk addition
2. **Convert KernScores** → 100K+ classical works via Humdrum toolkit
3. **Create Indian classical sheets** in MuseScore → ragas + bandishes (50-100 ragas = unique, indexable content)
4. **Generate via LLM** → simple scale patterns, aroh/avroh for every raga, exported as MusicXML
5. **User submissions** → allow composers/teachers to upload their own Indian notation

---

## 3. SEO: SPA vs SSR

### Can a CRA (Client-Side Rendered) App Rank?

**Yes, Google can index client-rendered SPAs.** Google runs an evergreen Chromium to execute JavaScript after crawling.

**But there are caveats:**
- Two-wave indexing: **crawl → render queue → index** (delayed)
- Render queue can take **seconds to days** (Google's own docs)
- Content hidden behind user interaction (tabs, clicks, lazy-loading) may be missed
- Page metadata (`<title>`, `<meta description>`) set via JS may not be picked up reliably
- Dynamic content that fires after user interaction won't be seen

### SSR/SSG Advantage

| Factor | CRA (CSR) | Next.js (SSR/SSG) |
|--------|-----------|-------------------|
| HTML response | Single `<div id="root">` | Full content + metadata |
| Index speed | Crawl → Render → Index | Crawl → Index (instant) |
| Core Web Vitals | Lower LCP (JS parse) | Higher LCP (server delivers HTML) |
| Meta tags | Injected via JS (unreliable) | In `<head>` from server |
| Structured data (JSON-LD) | Injected via JS (rendered) | In initial HTML (always seen) |
| Social preview (og:tags) | Hard to do client-side | Native support |

**Verdict:** CRA *can* rank, but **Next.js will rank better, faster, and more reliably**. Since the Next.js migration is already planned, SEO is another strong reason to do it.

### Immediate SEO Wins (without SSR)

- Add server-side rendered meta tags (via Express — inject `<title>` and `<meta>` in `index.html` per route)
- Add JSON-LD structured data to the HTML response
- Add an XML sitemap
- Use server-side rendered pages for sheet details (Express template) before full migration

---

## 4. Content Below Sheets

For every sheet detail page, add rich content below the notation viewer:

```
┌──────────────────────────────────────────────┐
│  {sheetName} — {Artist}                       │
│  Raga: Yaman · Scale: C Major · Tal: Tintal   │
├──────────────────────────────────────────────┤
│                                              │
│  [Western Staff] | [Indian Bhatkhande]       │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  About This Composition                      │
│  ───────────────────────                     │
│                                              │
│  • Historical context: who composed it,      │
│    when, why it's significant                │
│                                              │
│  • Raga details: aroh/avroh, pakad,         │
│    vadi/samvadi, time of day, associated     │
│    mood (rasa)                               │
│                                              │
│  • Tal structure: matra count, theka         │
│    (bol pattern), tali/khali points          │
│                                              │
│  • Performance notes: tempo variations,      │
│    ornamentation (gamak, meend),             │
│    improvisation tips                        │
│                                              │
│  • Lyrics (if a composition with words)      │
│    in Devanagari + transliteration + English │
│                                              │
│  ───────────────────────                     │
│  Related Sheets                              │
│  [Card] [Card] [Card] [Card]                │
│  (same raga, same artist, same tal)         │
│                                              │
└──────────────────────────────────────────────┘
```

**SEO value of this section:**
- 500-1000+ words of unique, relevant content per page
- Targets long-tail keywords: "Yaman raga sheet music", "Tintal theka notes", etc.
- Internal links to related sheets → spreads link equity
- User engagement (time on page, scroll depth)

---

## 5. Ad Monetization

### Goal
Pay for server + domain fees (est. $10-15/month) and raise money for user's charity foundation.

### Standard Path

| Step | Action |
|------|--------|
| **1** | Get sufficient content (50-100 pages minimum) |
| **2** | Add Privacy Policy page (GDPR required) |
| **3** | Apply to **Google AdSense** |
| **4** | Once approved, place ad units |
| **5** | Optimize placement for CPM |

### Expected Revenue

| Metric | Estimate | Notes |
|--------|----------|-------|
| **CPM** (music/education) | $1-5 | Indian classical is niche but engaged |
| **With 10K pageviews/mo** | $10-50/mo | Covers VPS ($5-10) + domain ($1-2) |
| **With 100K pageviews/mo** | $100-500/mo | Surplus to charity |

### Ad Placement

```
  [Leaderboard 728×90]              ← top of sheet page
  ↓
  Sheet content
  ↓
  [Rectangle 300×250] above fold    ← sidebar or below title
  ↓
  Long-form content about raga
  ↓
  [Leaderboard 728×90]              ← bottom
```

### Requirements
- ✅ Have a Privacy Policy page
- ✅ Have an About/Contact page
- ✅ 50+ pages of quality, original content
- ❌ No copyrighted content (use public domain or CC-licensed sheets only)
- ✅ Clean, professional design (already have one)

---

## 6. Verification Strategy

### How to Validate the Bhatkhande Algorithm

**Option A: Snapshot Tests**

Create `tests/bhatkhande/` with known-good input/output pairs:

```
tests/bhatkhande/
  ├── sajan_more_input.xml
  ├── sajan_more_expected.json    // expected beat-grid output
  ├── estrellita_input.xml
  ├── estrellita_expected.json
  └── bhatkhande.test.js          // runs parser → compare → snapshot
```

**Option B: Side-by-Side Viewer**

On the Post page, render both OSMD (Western staff) and Bhatkhande grid simultaneously. Look for:
- Same number of notes/beats
- Same pitch mapping
- Correct timing (note durations → beat grouping)

**Option C: MIDI Rendering**

Parse the MusicXML → MIDI notes on both systems. Compare the MIDI output of the Bhatkhande algorithm against OSMD's interpretation. Any difference = bug.

### Recommended

**Short term:** Side-by-side viewer – lets you manually verify by comparing staff vs grid.

**Long term:** Snapshot tests in CI for automated regression detection.
