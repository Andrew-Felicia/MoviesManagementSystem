package com.vincent.MovieLibrary.controller;

import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.repository.MovieRepository;
import com.vincent.MovieLibrary.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    public List<Movie> getAllMovies() {
        return movieService.getAllMovies();
    }

    @GetMapping("/{id}")
    public Movie getMovieById(@PathVariable Integer id) {
        return movieService.getMovieById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Movie createMovie(@Valid @RequestBody Movie movie) {
        return movieService.createMovie(movie);
    }

    @PutMapping("/{id}")
    public Movie updateMovie(
            @PathVariable Integer id,
            @Valid @RequestBody Movie updatedMovie
    ) {
        return movieService.updateMovie(id, updatedMovie);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMovie(@PathVariable Integer id) {
        movieService.deleteMovie(id);
    }

}
