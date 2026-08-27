package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.MovieBatchRequest;
import com.vincent.MovieLibrary.dto.MovieBatchResponse;
import com.vincent.MovieLibrary.dto.MovieRequest;
import com.vincent.MovieLibrary.dto.MovieResponse;
import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.exception.MovieNotFoundException;
import com.vincent.MovieLibrary.repository.MovieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MovieService {

    private final MovieRepository movieRepository;

    public MovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MovieResponse getMovieById(Integer id) {
        return toResponse(findMovieById(id));
    }

    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = new Movie();
        copyRequestToEntity(request, movie);

        Movie savedMovie = movieRepository.save(movie);

        return toResponse(savedMovie);
    }

    @Transactional
    public MovieBatchResponse createMovies(MovieBatchRequest request) {
        Set<String> movieKeys = new HashSet<>();
        for (Movie existing : movieRepository.findAll()) {
            movieKeys.add(duplicateKey(
                    existing.getTitle(),
                    existing.getReleaseYear(),
                    existing.getFilePath()
            ));
        }

        List<Movie> moviesToCreate = new ArrayList<>();
        int skippedDuplicates = 0;
        for (MovieRequest movieRequest : request.movies()) {
            String key = duplicateKey(
                    movieRequest.title(),
                    movieRequest.releaseYear(),
                    movieRequest.filePath()
            );
            if (!movieKeys.add(key)) {
                skippedDuplicates++;
                continue;
            }

            Movie movie = new Movie();
            copyRequestToEntity(movieRequest, movie);
            moviesToCreate.add(movie);
        }

        List<MovieResponse> imported = movieRepository.saveAll(moviesToCreate)
                .stream()
                .map(this::toResponse)
                .toList();
        return new MovieBatchResponse(
                imported.size(),
                skippedDuplicates,
                imported
        );
    }

    public MovieResponse updateMovie(
            Integer id,
            MovieRequest request
    ) {
        Movie existingMovie = findMovieById(id);

        copyRequestToEntity(request, existingMovie);

        Movie savedMovie = movieRepository.save(existingMovie);

        return toResponse(savedMovie);
    }


    public void deleteMovie(Integer id) {
        Movie movie = findMovieById(id);
        movieRepository.delete(movie);
    }

    private Movie findMovieById(Integer id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException(id));
    }

    //This method converts request data into an entity:
    private void copyRequestToEntity(
            MovieRequest request,
            Movie movie
    ) {
        movie.setTitle(request.title());
        movie.setReleaseYear(request.releaseYear());
        movie.setDirector(request.director());
        movie.setGenre(request.genre());
        movie.setRuntimeMinutes(request.runtimeMinutes());
        movie.setLanguage(request.language());
        movie.setWatched(request.watched());
        movie.setPersonalRating(request.personalRating());
        movie.setFilePath(request.filePath());
        movie.setNotes(request.notes());
    }

    //This method converts an entity into response data:
    private MovieResponse toResponse(Movie movie) {
        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getReleaseYear(),
                movie.getDirector(),
                movie.getGenre(),
                movie.getRuntimeMinutes(),
                movie.getLanguage(),
                movie.getWatched(),
                movie.getPersonalRating(),
                movie.getFilePath(),
                movie.getNotes(),
                movie.getCreatedAt()
        );
    }

    private String duplicateKey(String title, Integer releaseYear, String filePath) {
        return title.trim().toLowerCase(Locale.ROOT)
                + "\u0000" + releaseYear
                + "\u0000" + filePath.trim().toLowerCase(Locale.ROOT);
    }
}
