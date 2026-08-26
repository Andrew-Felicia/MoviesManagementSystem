# Favicon suites

Favicon assets live in `frontend/public/favicons`.

The active suite is selected in `frontend/index.html` in the block marked
`Active favicon suite`.

Each suite should contain three files with the same recognizable prefix:

- `<suite-name>.ico` for browser compatibility
- `<suite-name>-32.png` for modern browser tabs
- `<suite-name>-touch.png` for Apple home-screen bookmarks

To switch suites, change the three `/favicons/...` paths in that marked block
and update the suite name in its comment.
