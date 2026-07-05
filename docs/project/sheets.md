# Sheets

## Current Status

Sheets are stored in MongoDB as compressed (`xmlGz`) Binary documents.

### Migration from Static Files

Previously, all MusicXML files lived in `public/sheets/` and were served
statically. The migration script (`scripts/migrate-to-db.ts`) moves them to
MongoDB.

After migration, `public/sheets/*.xml` patterns are added to `.gitignore`.

### WindyPigeon (wp_*) Sheets

The `wp_1` through `wp_11` files were exported with auto-generated filenames.
The migration script extracts their real titles from `<work-title>` / `<movement-title>`
in the XML and renames them in the database.

| File | Actual Title |
|------|-------------|
| wp_1.xml | 新載歌載舞 / 賣什貨 |
| wp_2.xml | 天涯歌女 / 四季歌 |
| wp_10.xml | Tudung Periuk |

### Sheet Sources

| Source | Count | Description |
|--------|-------|-------------|
| OSMD test suite | ~250 | Test files from OpenSheetMusicDisplay |
| Classical | ~10 | Beethoven, Chopin, Bach, etc. |
| WindyPigeon | 11 | Community-uploaded sheets (Cantonese/Malay) |
| Indian raga | ~5 | Raag Bhupali, Sajan More, etc. |
| User uploads | varies | Via POST /api/posts or admin |

### Finding Open-Source Sheets

The search page at `/search` allows browsing all sheets. Empty search returns
all sheets (paginated, 6 per page).

Potential sources for adding more:
- MuseScore public domain (Creative Commons)
- PDMX (Public Domain Music XML) repository
- OpenSheetMusicDisplay test data
- Community contributions via upload form

### Uploading

Use `POST /api/posts` with `xmlContent` (raw XML string) or `file` (multipart
upload of .xml/.mxl/.musicxl).

Required fields: `sheetName`, `xmlContent` or file.
Optional: `Artist`, `Genres`, `scale`, `password`.
