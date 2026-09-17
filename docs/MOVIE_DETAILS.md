# Movie details

After signing in, click a movie title, cover, or row in the catalog to open its
details page. Mobile cards work the same way. The page displays the saved movie
metadata, watched status, personal rating, notes, file location, and date added.

Each movie has a bookmarkable URL such as `/#movies/1`. Reloading that URL or
opening it in another tab still requires authentication. Browser Back/Forward
navigation works, and “Back to library” preserves the current search, filters,
sort order, and page while the application stays open. English and Chinese are
supported. Edit, delete, and watched controls continue to act independently.

The frontend uses the existing owner-scoped `GET /api/movies/{id}` endpoint.
Missing or inaccessible movies show an unavailable state, temporary failures
offer Retry, and expired sessions return to login. No API or database migration
is needed. File locations are displayed as text; clicking a movie does not open
or change files on the device.

Verification: run `npm run coverage` and `npm run build` from `frontend/`.
