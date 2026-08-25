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

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
