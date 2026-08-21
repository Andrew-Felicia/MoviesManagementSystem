package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.MovieRequest;
import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.repository.MovieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTimeout;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MovieServiceStressTest {

    private static final int ITERATIONS = 10_000;

    @Mock
    private MovieRepository movieRepository;

    private MovieService movieService;
    private Movie movie;
    private MovieRequest request;

    @BeforeEach
    void setUp() {
        movieService = new MovieService(movieRepository);
        movie = movie();
        request = request();
    }

    @Test
    void getAllMoviesMapsLargeResultSet() {
        when(movieRepository.findAll())
                .thenReturn(Collections.nCopies(ITERATIONS, movie));

        assertTimeout(Duration.ofSeconds(10), () ->
                assertThat(movieService.getAllMovies()).hasSize(ITERATIONS));
    }

    @Test
    void getMovieByIdHandlesRepeatedLookups() {
        when(movieRepository.findById(1)).thenReturn(Optional.of(movie));

        assertTimeout(Duration.ofSeconds(10), () -> {
            for (int i = 0; i < ITERATIONS; i++) {
                assertThat(movieService.getMovieById(1).id()).isEqualTo(1);
            }
        });
    }

    @Test
    void createMovieHandlesRepeatedCreates() {
        when(movieRepository.save(any(Movie.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        assertTimeout(Duration.ofSeconds(10), () -> {
            for (int i = 0; i < ITERATIONS; i++) {
                assertThat(movieService.createMovie(request).title())
                        .isEqualTo(request.title());
            }
        });
    }

    @Test
    void updateMovieHandlesRepeatedUpdates() {
        when(movieRepository.findById(1)).thenReturn(Optional.of(movie));
        when(movieRepository.save(movie)).thenReturn(movie);

        assertTimeout(Duration.ofSeconds(10), () -> {
            for (int i = 0; i < ITERATIONS; i++) {
                assertThat(movieService.updateMovie(1, request).id()).isEqualTo(1);
            }
        });
    }

    @Test
    void deleteMovieHandlesRepeatedDeletes() {
        when(movieRepository.findById(1)).thenReturn(Optional.of(movie));

        assertTimeout(Duration.ofSeconds(10), () -> {
            for (int i = 0; i < ITERATIONS; i++) {
                movieService.deleteMovie(1);
            }
        });
    }

    private static Movie movie() {
        Movie movie = new Movie();
        movie.setId(1);
        movie.setTitle("Stress Movie");
        movie.setReleaseYear(2026);
        movie.setDirector("Director");
        movie.setGenre("Drama");
        movie.setRuntimeMinutes(100);
        movie.setLanguage("English");
        movie.setWatched(false);
        movie.setFilePath("/movies/stress.mkv");
        return movie;
    }

    private static MovieRequest request() {
        return new MovieRequest(
                "Stress Movie", 2026, "Director", "Drama", 100,
                "English", false, null, "/movies/stress.mkv", null
        );
    }
}
