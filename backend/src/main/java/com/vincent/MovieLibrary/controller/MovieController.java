package com.vincent.MovieLibrary.controller;

import com.vincent.MovieLibrary.dto.MovieBatchRequest;
import com.vincent.MovieLibrary.dto.MovieBatchOperationResponse;
import com.vincent.MovieLibrary.dto.MovieBatchResponse;
import com.vincent.MovieLibrary.dto.MovieRequest;
import com.vincent.MovieLibrary.dto.MovieResponse;
import com.vincent.MovieLibrary.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping({"", "/"}) //make sure both /api/movies and /api/movies/ are working.
    public List<MovieResponse> getAllMovies(Authentication authentication) {
        return movieService.getAllMovies(authentication.getName());
    }

    @GetMapping("/{id}")
    public MovieResponse getMovieById(
            Authentication authentication,
            @PathVariable Integer id
    ) {
        return movieService.getMovieById(authentication.getName(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovieResponse createMovie(
            Authentication authentication,
            @Valid @RequestBody MovieRequest request
    ) {
        return movieService.createMovie(authentication.getName(), request);
    }

    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.CREATED)
    public MovieBatchResponse createMovies(
            Authentication authentication,
            @Valid @RequestBody MovieBatchRequest request
    ) {
        return movieService.createMovies(authentication.getName(), request);
    }

    @PutMapping("/batch/watched")
    public MovieBatchOperationResponse markAllMoviesWatched(Authentication authentication) {
        return movieService.markAllMoviesWatched(authentication.getName());
    }

    @PutMapping("/batch/unwatched")
    public MovieBatchOperationResponse markAllMoviesUnwatched(Authentication authentication) {
        return movieService.markAllMoviesUnwatched(authentication.getName());
    }

    @DeleteMapping("/batch")
    public MovieBatchOperationResponse deleteAllMovies(Authentication authentication) {
        return movieService.deleteAllMovies(authentication.getName());
    }

    @PutMapping("/{id}")
    public MovieResponse updateMovie(
            Authentication authentication,
            @PathVariable Integer id,
            @Valid @RequestBody MovieRequest request
    ) {
        return movieService.updateMovie(authentication.getName(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMovie(Authentication authentication, @PathVariable Integer id) {
        movieService.deleteMovie(authentication.getName(), id);
    }

}
