# Movie posters

The add/edit form accepts an optional HTTP(S) poster URL or a PNG, JPEG, or
WebP upload up to 256 KiB. The selected poster is previewed and can be replaced
or removed. It appears on desktop rows, mobile cards, and the movie details page.
Missing or broken images fall back to the movie's initials.

CSV imports and exports now support an optional `posterUrl` column. Existing
CSV files without that column remain valid. Both uploaded images and images
downloaded from URLs are stored as base64 image data URLs in the database, not
as external links. CSV exports include those complete image data URLs, so the
CSV itself carries the posters. The import limit is 100 MiB and 5,000 movies;
each individual image must be at most 256 KiB. Large exports over 100 MiB must
be split into smaller CSV files before importing.

Restart the backend after updating the code. Its startup SQL adds the nullable
`movies.poster_url TEXT` column automatically and leaves existing rows intact.
The migration is idempotent. Older application versions can ignore the extra
column when rolling back; do not drop it if you want to preserve posters.
No separate upload directory or image-hosting account is required.

The existing movie API accepts and returns `posterUrl` for create, update,
list, detail, and batch import. The optional field is limited to 350,000
characters and HTTP(S) URLs or PNG/JPEG/WebP base64 data URLs. Authorization and
CSRF behavior are unchanged. The server downloads HTTP(S) URLs on create,
update, and batch import, validates image signatures and size, and stores the
result in `poster_url`. The column name stays unchanged for compatibility;
its contents now hold the actual PNG/JPEG/WebP image, encoded as text. Database
backups therefore include posters. No separate file volume is necessary.

Remote downloads allow public addresses on ports 80/443 only. The connection
uses validated DNS results, validates every redirect (maximum three), applies
connection/read/request deadlines, and bounds image bytes even without a
Content-Length header. Non-image responses, unavailable sources and oversized
images return a poster field error. A failed batch does not save any movies.
Large imports of remote URLs may take time; use the embedded CSV for offline
imports and configure any VPS reverse-proxy request timeout accordingly.
VPNs that replace public DNS answers with reserved addresses (for example,
`198.18.0.0/15`) will trigger the address restriction. Use embedded images or
uploads in that environment, or use normal public DNS for the backend.

Existing URL-only records are preserved on deployment. Clicking **Export CSV**
converts them to stored images through the authenticated, owner-scoped
`POST /api/movies/posters/localize` endpoint before downloading the CSV. Editing
and saving an individual movie also converts its poster. A failed conversion
rolls back and reports an error; replace/remove the unavailable URL and retry.
Existing embedded images need no migration. Duplicate imports still skip
existing movies, so use Export CSV to convert previously imported records.

The ready-to-import 500-movie file and its source/placeholder notes are in
`outputs/imdb-500/`. IMDb ratings remain separate from your personal ratings.

Verification: `cd frontend && npm run coverage && npm run build`, then
`cd backend && ./mvnw verify` from the project root. Tests cover poster
persistence, URL conversion, updating/removal, batch rollback, ownership,
download limits, private-address rejection, redirects, legacy CSVs, image
fallback, uploads, bilingual form labels, and existing-data migration.
