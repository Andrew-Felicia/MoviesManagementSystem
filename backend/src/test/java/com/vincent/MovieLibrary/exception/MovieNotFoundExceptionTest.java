package com.vincent.MovieLibrary.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import static org.assertj.core.api.Assertions.assertThat;

class MovieNotFoundExceptionTest {

    @Test
    void containsMovieIdInMessage() {
        MovieNotFoundException exception = new MovieNotFoundException(42);

        assertThat(exception).hasMessage("Movie not found with id: 42");
    }

    @Test
    void isAnnotatedAs404NotFound() {
        ResponseStatus responseStatus = MovieNotFoundException.class
                .getAnnotation(ResponseStatus.class);

        assertThat(responseStatus).isNotNull();
        assertThat(responseStatus.value()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
