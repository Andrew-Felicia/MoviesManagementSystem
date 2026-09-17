# 500 IMDb movies with posters

Import `imdb-500-with-posters.csv` through **Import CSV** after restarting the
updated backend. It contains exactly 500 distinct IMDb IDs and is about 20.1 MiB
(21,123,371 bytes). Each `posterUrl` cell contains a complete JPEG encoded as a
base64 data URL. The CSV embeds all 500 posters, and importing it stores those
images in your database without contacting an external image host. Subsequent
CSV exports also include the image data. Use Framebase to import the file;
spreadsheet editors may truncate long image cells when resaving CSV files.

This is a selection from historical IMDb datasets, not a current official IMDb
Top 500 ranking. Rows follow the order of the metadata snapshot. Films without
an unambiguous matching title/year or a reachable poster were excluded. All 500
selected posters were downloaded on 2026-09-17 and verified as readable JPEGs.
External poster links are no longer needed to import or display this file.

## Fields to personalize

- `watched` is false and `personalRating` is blank for every movie.
- `filePath` is `NOT_SET/<imdbId>`. This is an explicit placeholder, not a file
  on your computer. Replace it with the location of your own movie file.
- `language` is `Not provided` because the metadata snapshot has no language
  field. Replace it if you want language filtering.
- `notes` retains the IMDb link and historical IMDb rating after import.
- Extra columns `imdbId`, `imdbUrl`, `imdbRating`, and `imdbVotes` are included
  for reference. Framebase imports its supported columns and ignores the extras.

## Sources and method

Movie titles, years, directors, genres, runtimes, ratings, vote counts, and image
identifiers come from the [IMDb top-1000 metadata snapshot](https://github.com/brianwei01/IMDb-Movies-EDA/blob/main/imdb_top_1000.csv),
associated with the [Kaggle IMDb movies dataset](https://www.kaggle.com/datasets/harshitshankhdhar/imdb-dataset-of-top-1000-movies-and-tv-shows).
IMDb IDs were matched by normalized title and exact release year against the
[2025-04-16 IMDb top-1000 snapshot](https://gist.github.com/vimagick/fbc551ecece8639dc0bea18ac7113450/77915732b0da29f08d1dfc9a5b90090e8ce8cb22).
Image identifiers are unchanged; the Amazon image rendition suffix requests
a 300px-wide poster instead of the source's 67px thumbnail.

Ratings and votes reflect the metadata source's historical values, not current
IMDb values. Posters belong to their respective rights holders. This CSV does
not include movie files or grant rights to redistribute poster artwork.
