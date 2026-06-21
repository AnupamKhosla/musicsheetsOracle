# ⚠️ STRONGER MODEL REVIEW NEEDED

> This plan was drafted by GLM-5.1-FP8. Review by a stronger model
> (DeepSeek V4 Flash or equivalent) before execution. Verify:
> - MongoDB document size limits (16MB max — XML avg 50KB, OK)
> - Atlas shared tier storage (512MB free = ~10K sheets uncompressed)
> - API response size impact (~60KB per request)
> - Backward compatibility with existing sheets

---

# Plan: Store XML Music Sheets in MongoDB

**Date**: 2026-06-21
**Author**: GLM-5.1-FP8
**Status**: Pending review

## 1. Current Architecture

- MongoDB stores **metadata only**: `{ sheetName, Artist, Genres, scale, date, password }`
- XML files live in `public/sheets/` (served statically via `/sheets/{name}.xml`)
- Problem: 200+ XML files would bloat the git repo

## 2. Proposed Schema

```ts
interface SheetDocument {
  sheetName: string;
  Artist: string;
  Genres: string;
  scale: string;
  date: Date;
  password: string;
  source?: string;
  xmlContent: string;         // NEW — raw MusicXML string
  xmlCompressed?: boolean;     // FUTURE — gzip+base64 when needed
}
```

## 3. API Changes

### POST `/api/posts` (create sheet)
- Accept `xmlContent` in request body
- Store `xmlContent` alongside metadata

### GET `/api/posts/[id]` (fetch sheet)
- Return `xmlContent` in response JSON
- Frontend uses this directly (no `/sheets/{name}.xml` fetch needed)

## 4. Frontend Changes

**File**: `src/components/MusicSheetViewer.tsx`

```ts
// BEFORE
loadMusicXmlFromUrl(`/sheets/${sheetName}.xml`)

// AFTER
const post = await fetch(`/api/posts/${id}`).then(r => r.json());
const parsed = parseMusicXMLString(post.xmlContent);
```

No changes to OSMDWrapper or IndianNotation — they accept XML strings.

## 5. Migration Script

**File**: `scripts/migrate-xml-to-db.ts`

1. Read all `public/sheets/*.xml` files
2. For each file, find DB doc by `sheetName`
3. `$set: { xmlContent: <file contents> }`
4. Verify count = 100%
5. (Optional) Remove files from disk after migration

## 6. Compression (Future)

If Atlas storage becomes an issue:
```ts
import { gzipSync, gunzipSync } from 'zlib';

// Write: gzipSync(xmlString).toString('base64')
// Read:  gunzipSync(Buffer.from(doc.xmlContent, 'base64')).toString()
```

Average: 50KB → ~15KB gzip'd (3x savings).

## 7. Tradeoffs

| Store in DB | Static Files |
|-------------|--------------|
| ✅ Single backup | ✅ Fast CDN serving |
| ✅ Atomic writes | ✅ Smaller DB |
| ✅ No file sync | ❌ Need file sync (VPS ↔ local) |
| ❌ No CDN cache | |
| ❌ ~50ms slower per load | |

## 8. Review Checklist

- [ ] MongoDB 16MB document limit OK? (Yes — XML avg 50KB)
- [ ] Atlas storage quota OK? (512MB free tier = ~10K sheets)
- [ ] API response size OK? (~60KB per request)
- [ ] Gzip compression needed now? (No — start plain, add later)
- [ ] Backward compatibility? (Sheets without `xmlContent` → fallback to disk)
- [ ] Index needed on `xmlContent`? (No — never query by XML content)

## 9. Implementation Order

1. Update API routes (POST + GET)
2. Update MusicSheetViewer to fetch XML from API
3. Run migration script for existing sheets
4. Import 263 OSMD public domain sheets
5. Test playback + notation rendering
6. Add `public/sheets/*.xml` to `.gitignore` (after migration)
