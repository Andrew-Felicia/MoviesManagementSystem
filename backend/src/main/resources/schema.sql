CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    title VARCHAR(255),
    release_year INTEGER,
    director VARCHAR(255),
    genre VARCHAR(255),
    runtime_minutes INTEGER,
    language VARCHAR(255),
    watched BOOLEAN,
    personal_rating DOUBLE PRECISION,
    file_path VARCHAR(255),
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE movies ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
