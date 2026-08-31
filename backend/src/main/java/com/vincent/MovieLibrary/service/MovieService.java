package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.MovieBatchRequest;
import com.vincent.MovieLibrary.dto.MovieBatchOperationResponse;
import com.vincent.MovieLibrary.dto.MovieBatchResponse;
import com.vincent.MovieLibrary.dto.MovieRequest;
import com.vincent.MovieLibrary.dto.MovieResponse;
import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.exception.MovieNotFoundException;
import com.vincent.MovieLibrary.repository.MovieRepository;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
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
    private final UserAccountRepository userAccountRepository;

    public MovieService(MovieRepository movieRepository, UserAccountRepository userAccountRepository) {
        this.movieRepository = movieRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public List<MovieResponse> getAllMovies(String username) {
        return movieRepository.findAllByOwner_UsernameIgnoreCase(username)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MovieResponse getMovieById(String username, Integer id) {
        return toResponse(findMovieById(username, id));
    }

    public MovieResponse createMovie(String username, MovieRequest request) {
        Movie movie = new Movie();
        movie.setOwner(findOwner(username));
        copyRequestToEntity(request, movie);

        Movie savedMovie = movieRepository.save(movie);

        return toResponse(savedMovie);
    }

    @Transactional
    public MovieBatchResponse createMovies(String username, MovieBatchRequest request) {
        UserAccount owner = findOwner(username);
        Set<String> movieKeys = new HashSet<>();
        for (Movie existing : movieRepository.findAllByOwner_UsernameIgnoreCase(username)) {
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
            movie.setOwner(owner);
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
            String username,
            Integer id,
            MovieRequest request
    ) {
        Movie existingMovie = findMovieById(username, id);

        copyRequestToEntity(request, existingMovie);

        Movie savedMovie = movieRepository.save(existingMovie);

        return toResponse(savedMovie);
    }


    public void deleteMovie(String username, Integer id) {
        Movie movie = findMovieById(username, id);
        movieRepository.delete(movie);
    }

    @Transactional
    public MovieBatchOperationResponse markAllMoviesWatched(String username) {
        return new MovieBatchOperationResponse(
                movieRepository.markAllWatchedByOwnerUsername(username)
        );
    }

    @Transactional
    public MovieBatchOperationResponse markAllMoviesUnwatched(String username) {
        return new MovieBatchOperationResponse(
                movieRepository.markAllUnwatchedByOwnerUsername(username)
        );
    }

    @Transactional
    public MovieBatchOperationResponse deleteAllMovies(String username) {
        return new MovieBatchOperationResponse(
                movieRepository.deleteAllByOwnerUsername(username)
        );
    }

    private Movie findMovieById(String username, Integer id) {
        return movieRepository.findByIdAndOwner_UsernameIgnoreCase(id, username)
                .orElseThrow(() -> new MovieNotFoundException(id));
    }

    private UserAccount findOwner(String username) {
        return userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated account no longer exists"));
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
