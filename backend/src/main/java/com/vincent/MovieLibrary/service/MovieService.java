package com.vincent.MovieLibrary.service;


import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.exception.MovieNotFoundException;
import com.vincent.MovieLibrary.repository.MovieRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MovieService {

    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Movie getMovieById(Integer id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException(id));
    }

    public Movie createMovie(Movie movie) {
        return movieRepository.save(movie);
    }

    public Movie updateMovie(Integer id, Movie updatedMovie) {
        Movie existingMovie = getMovieById(id);

        existingMovie.setTitle(updatedMovie.getTitle());
        existingMovie.setReleaseYear(updatedMovie.getReleaseYear());
        existingMovie.setDirector(updatedMovie.getDirector());
        existingMovie.setGenre(updatedMovie.getGenre());
        existingMovie.setRuntimeMinutes(updatedMovie.getRuntimeMinutes());
        existingMovie.setLanguage(updatedMovie.getLanguage());
        existingMovie.setWatched(updatedMovie.getWatched());
        existingMovie.setPersonalRating(updatedMovie.getPersonalRating());
        existingMovie.setFilePath(updatedMovie.getFilePath());
        existingMovie.setNotes(updatedMovie.getNotes());

        return movieRepository.save(existingMovie);
    }

    public void deleteMovie(Integer id) {
        Movie movie = getMovieById(id);
        movieRepository.delete(movie);
    }
}
