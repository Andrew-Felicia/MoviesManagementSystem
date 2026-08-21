package com.vincent.MovieLibrary.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class MovieRequestValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidatorFactory() {
        validatorFactory.close();
    }

    @Test
    void validRequestHasNoViolations() {
        assertThat(validator.validate(new RequestBuilder().build())).isEmpty();
    }

    @Test
    void boundaryValuesAreAccepted() {
        MovieRequest minimum = new RequestBuilder()
                .releaseYear(1888)
                .runtimeMinutes(1)
                .personalRating(0.0)
                .build();
        MovieRequest maximum = new RequestBuilder()
                .releaseYear(2100)
                .runtimeMinutes(1000)
                .personalRating(10.0)
                .build();

        assertThat(validator.validate(minimum)).isEmpty();
        assertThat(validator.validate(maximum)).isEmpty();
    }

    @Test
    void optionalRatingAndNotesMayBeNull() {
        MovieRequest request = new RequestBuilder()
                .personalRating(null)
                .notes(null)
                .build();

        assertThat(validator.validate(request)).isEmpty();
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidRequests")
    void invalidRequestProducesExpectedViolation(
            String description,
            MovieRequest request,
            String field,
            String message
    ) {
        Set<ConstraintViolation<MovieRequest>> violations =
                validator.validate(request);

        assertThat(violations).anySatisfy(violation -> {
            assertThat(violation.getPropertyPath().toString()).isEqualTo(field);
            assertThat(violation.getMessage()).isEqualTo(message);
        });
    }

    private static Stream<Arguments> invalidRequests() {
        return Stream.of(
                invalid("null title", new RequestBuilder().title(null),
                        "title", "Title is required"),
                invalid("blank title", new RequestBuilder().title("   "),
                        "title", "Title is required"),
                invalid("title too long", new RequestBuilder().title("T".repeat(201)),
                        "title", "Title must not exceed 200 characters"),
                invalid("null release year", new RequestBuilder().releaseYear(null),
                        "releaseYear", "Release year is required"),
                invalid("release year too early", new RequestBuilder().releaseYear(1887),
                        "releaseYear", "Release year must be 1888 or later"),
                invalid("release year too late", new RequestBuilder().releaseYear(2101),
                        "releaseYear", "Release year must not exceed 2100"),
                invalid("blank director", new RequestBuilder().director(""),
                        "director", "Director is required"),
                invalid("director too long", new RequestBuilder().director("D".repeat(151)),
                        "director", "Director must not exceed 150 characters"),
                invalid("blank genre", new RequestBuilder().genre(""),
                        "genre", "Genre is required"),
                invalid("genre too long", new RequestBuilder().genre("G".repeat(101)),
                        "genre", "Genre must not exceed 100 characters"),
                invalid("null runtime", new RequestBuilder().runtimeMinutes(null),
                        "runtimeMinutes", "Runtime is required"),
                invalid("runtime too short", new RequestBuilder().runtimeMinutes(0),
                        "runtimeMinutes", "Runtime must be at least 1 minute"),
                invalid("runtime too long", new RequestBuilder().runtimeMinutes(1001),
                        "runtimeMinutes", "Runtime must not exceed 1000 minutes"),
                invalid("blank language", new RequestBuilder().language(""),
                        "language", "Language is required"),
                invalid("language too long", new RequestBuilder().language("L".repeat(101)),
                        "language", "Language must not exceed 100 characters"),
                invalid("null watched", new RequestBuilder().watched(null),
                        "watched", "Watched status is required"),
                invalid("rating below zero", new RequestBuilder().personalRating(-0.1),
                        "personalRating", "Personal rating must be at least 0.0"),
                invalid("rating above ten", new RequestBuilder().personalRating(10.1),
                        "personalRating", "Personal rating must not exceed 10.0"),
                invalid("blank file path", new RequestBuilder().filePath(""),
                        "filePath", "File path is required"),
                invalid("file path too long", new RequestBuilder().filePath("/".repeat(1001)),
                        "filePath", "File path must not exceed 1000 characters"),
                invalid("notes too long", new RequestBuilder().notes("N".repeat(2001)),
                        "notes", "Notes must not exceed 2000 characters")
        );
    }

    private static Arguments invalid(
            String description,
            RequestBuilder builder,
            String field,
            String message
    ) {
        return Arguments.of(description, builder.build(), field, message);
    }

    private static final class RequestBuilder {
        private String title = "Interstellar";
        private Integer releaseYear = 2014;
        private String director = "Christopher Nolan";
        private String genre = "Science Fiction";
        private Integer runtimeMinutes = 169;
        private String language = "English";
        private Boolean watched = true;
        private Double personalRating = 9.8;
        private String filePath = "/movies/interstellar.mkv";
        private String notes = "Amazing soundtrack.";

        RequestBuilder title(String value) {
            title = value;
            return this;
        }

        RequestBuilder releaseYear(Integer value) {
            releaseYear = value;
            return this;
        }

        RequestBuilder director(String value) {
            director = value;
            return this;
        }

        RequestBuilder genre(String value) {
            genre = value;
            return this;
        }

        RequestBuilder runtimeMinutes(Integer value) {
            runtimeMinutes = value;
            return this;
        }

        RequestBuilder language(String value) {
            language = value;
            return this;
        }

        RequestBuilder watched(Boolean value) {
            watched = value;
            return this;
        }

        RequestBuilder personalRating(Double value) {
            personalRating = value;
            return this;
        }

        RequestBuilder filePath(String value) {
            filePath = value;
            return this;
        }

        RequestBuilder notes(String value) {
            notes = value;
            return this;
        }

        MovieRequest build() {
            return new MovieRequest(
                    title,
                    releaseYear,
                    director,
                    genre,
                    runtimeMinutes,
                    language,
                    watched,
                    personalRating,
                    filePath,
                    notes
            );
        }
    }
}
