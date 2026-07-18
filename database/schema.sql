CREATE TABLE movies (
    id SERIAL PRIMARY KEY,

    title TEXT NOT NULL,

    release_year INTEGER,

    director TEXT,

    genre TEXT,

    runtime_minutes INTEGER,

    language TEXT,

    watched BOOLEAN DEFAULT FALSE,

    personal_rating NUMERIC(3,1),

    file_path TEXT,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);