-- Now every time you execute seed.sql, PostgreSQL will:
-- Delete all existing rows from movies.
-- Reset the ID sequence so the first inserted movie gets id = 1 again.
-- This makes your development environment predictable and avoids duplicate test data.
TRUNCATE TABLE movies RESTART IDENTITY;

INSERT INTO movies (
    title,
    release_year,
    director,
    genre,
    runtime_minutes,
    language,
    watched,
    personal_rating,
    file_path,
    notes
)
VALUES (
    'Interstellar',
    2014,
    'Christopher Nolan',
    'Science Fiction',
    169,
    'English',
    TRUE,
    9.8,
    '/Volumes/Movies/Interstellar.mkv',
    'Amazing soundtrack.'
),
(
    'Red Notice',
    2021,
    'Rawson Marshall Thurber',
    'Action Comedy',
    118,
    'English',
    TRUE,
    7.5,
    '/Volumes/Movies/Red Notice.mkv',
    'Fun action comedy with good chemistry between the actors.'
),
(
    'The Heat',
    2013,
    'Paul Feig',
    'Comedy',
    117,
    'English',
    TRUE,
    8.0,
    '/Volumes/Movies/The Heat.mkv',
    'Great chemistry between Sandra Bullock and Melissa McCarthy.'
);