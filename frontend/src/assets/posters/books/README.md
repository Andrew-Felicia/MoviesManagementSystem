# Poster book images

This folder is the source of truth for the interactive poster book on the
public landing page. The frontend discovers the images with Vite at build time.
There is no JavaScript poster list or manifest to update.

## Change the book

1. Add, replace, or remove image files in this folder.
2. Give each file a numeric prefix that represents its page position, such as
   `001-shawshank.jpg`, `002-godfather.jpg`, and `003-dark-knight.webp`.
3. Run `npm run dev` from `frontend/` to review the book locally.
4. Run `npm run build` and redeploy the application when the result is ready.

Every matching file becomes one page. Files are sorted by filename using
natural numeric order, so `002-...` appears before `010-...`. Renaming a file
changes its position; replacing the file while keeping its name preserves its
position.

Supported extensions are lowercase `.avif`, `.jpeg`, `.jpg`, `.png`, and
`.webp`. Use an even number of images for complete two-page spreads. If the
folder contains an odd number, the final right-hand page is blank. Keep at
least two images in the folder.

For smooth page turns, use portrait images near a 2:3 aspect ratio, about 300
pixels wide, and preferably below 250 KiB each. These images are bundled into
the frontend and served locally; the browser does not contact IMDb when the
book opens or turns a page.

This folder controls only the decorative landing-page book. Posters uploaded
for movies in a user's library are application data stored in PostgreSQL and
are managed through the movie form or CSV import.
