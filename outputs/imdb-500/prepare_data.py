"""Prepare import data from the downloaded historical IMDb metadata snapshots."""
import concurrent.futures
import csv
import json
from pathlib import Path
import re
import unicodedata
import urllib.request

ROOT = Path(__file__).resolve().parent

def normalize(title):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode().lower())

with (ROOT / 'source/imdb_top_1000.csv').open() as source:
    metadata = list(csv.DictReader(source))
with (ROOT / 'source/imdb-top-1000.tsv').open() as source:
    identities = list(csv.DictReader(source, delimiter='\t'))
identity_map = {(normalize(row['title']), row['year']): row for row in identities}
assert len(identity_map) == len(identities), 'Ambiguous title/year identity'
candidates = []
for row in metadata:
    identity = identity_map.get((normalize(row['Series_Title']), row['Released_Year']))
    if not identity:
        continue
    if not row['Runtime'].endswith(' min') or not 1 <= int(row['Runtime'][:-4]) <= 1000:
        continue
    candidates.append((row, identity))

cache_path = ROOT / 'poster_checks.json'
checks = json.loads(cache_path.read_text()) if cache_path.exists() else {}

def check_poster(pair):
    row, identity = pair
    # Request a legible 300px rendition of the same sourced image.
    poster = re.sub(r'\._V1_.*$', '._V1_SX300.jpg', row['Poster_Link'])
    if poster in checks:
        return poster, checks[poster]
    try:
        request = urllib.request.Request(poster, method='HEAD', headers={'User-Agent': 'Framebase CSV poster validation'})
        with urllib.request.urlopen(request, timeout=15) as result:
            check = {'status': result.status, 'contentType': result.headers.get('Content-Type'), 'checkedAt': '2026-09-17'}
            check['ok'] = result.status == 200 and check['contentType'].startswith('image/')
    except Exception as error:
        check = {'ok': False, 'error': str(error), 'checkedAt': '2026-09-17'}
    return poster, check

selected = []
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for start in range(0, len(candidates), 50):
        batch = candidates[start:start + 50]
        for (row, identity), (poster, check) in zip(batch, pool.map(check_poster, batch)):
            checks[poster] = check
            if not check['ok']:
                continue
            imdb_url = f'https://www.imdb.com/title/{identity["id"]}/'
            selected.append({
                'title': row['Series_Title'], 'releaseYear': int(row['Released_Year']),
                'director': row['Director'], 'genre': row['Genre'],
                'runtimeMinutes': int(row['Runtime'][:-4]), 'language': 'Not provided',
                'watched': 'false', 'personalRating': '',
                'filePath': f'NOT_SET/{identity["id"]}',
                'notes': f'IMDb: {imdb_url}\nIMDb rating in source snapshot: {row["IMDB_Rating"]}/10. File location not set.',
                'posterUrl': poster, 'imdbId': identity['id'], 'imdbUrl': imdb_url,
                'imdbRating': float(row['IMDB_Rating']), 'imdbVotes': int(row['No_of_Votes']),
            })
        cache_path.write_text(json.dumps(checks, indent=2))
        print(f'Checked {min(start + 50, len(candidates))} candidates; {len(selected)} reachable posters', flush=True)
        if len(selected) >= 500:
            break

assert len(selected) >= 500, f'Only {len(selected)} usable movies'
selected = selected[:500]
assert len({row['imdbId'] for row in selected}) == 500
(ROOT / 'selected.json').write_text(json.dumps(selected, ensure_ascii=False, indent=2))
print('Prepared exactly 500 unique IMDb movies with reachable poster URLs.', flush=True)
