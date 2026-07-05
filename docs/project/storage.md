# Storage

## MongoDB — `musicsheets` Collection

### Schema

```ts
interface SheetDocument {
  _id: ObjectId;
  sheetName: string;       // Display name / identifier
  Artist: string;          // Composer or artist
  Genres: string;          // Genre classification
  scale: string;           // Musical scale / raga
  date: Date;              // Upload date
  password: string;        // Optional delete password
  source?: string;         // Source attribution (e.g. 'public-domain')
  xmlGz: Binary;           // Gzip-compressed MusicXML (MongoDB Binary, ~15KB avg)
}
```

### Compression Strategy

- **On upload**: `zlib.gzipSync(xmlString)` → `new Binary(buffer)` → stored in `xmlGz`
- **On read**: `gunzipSync(doc.xmlGz.buffer)` → plain XML string → returned as `xmlContent`
- **No base64** — MongoDB `Binary` type stores raw gzip bytes natively
- **No browser decompress** — server decompresses before returning JSON
- **Compression ratio**: ~3:1 (50KB XML → ~15KB gzip'd)

### Limits

| Constraint | Value | Safety |
|-----------|-------|--------|
| MongoDB document size | 16MB | XML avg 50KB, max ~200KB |
| Atlas shared tier storage | 512MB | ~34K sheets at 15KB compressed |
| Index on `xmlGz` | Not needed | Never queried by XML content |

### List Queries

API routes that return multiple sheets (`GET /api/posts`, `GET /api/posts/latest`) project out `xmlGz` and `password` to keep responses small.

## Legacy Static Files

Before this storage schema, XML files lived in `public/sheets/` and were served
statically at `/sheets/{name}.xml`. These files remain for backward compatibility
until migration is complete:

- `public/sheets/*.xml` — All existing sheets (to be gitignored after migration)
- `public-sheets/` — Raw download cache of public-domain sources (already gitignored)
