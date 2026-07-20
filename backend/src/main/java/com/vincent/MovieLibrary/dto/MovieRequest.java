package com.vincent.MovieLibrary.dto;

import jakarta.validation.constraints.*;

public record MovieRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @NotNull(message = "Release year is required")
        @Min(value = 1888, message = "Release year must be 1888 or later")
        @Max(value = 2100, message = "Release year must not exceed 2100")
        Integer releaseYear,

        @NotBlank(message = "Director is required")
        @Size(max = 150, message = "Director must not exceed 150 characters")
        String director,

        @NotBlank(message = "Genre is required")
        @Size(max = 100, message = "Genre must not exceed 100 characters")
        String genre,

        @NotNull(message = "Runtime is required")
        @Min(value = 1, message = "Runtime must be at least 1 minute")
        @Max(value = 1000, message = "Runtime must not exceed 1000 minutes")
        Integer runtimeMinutes,

        @NotBlank(message = "Language is required")
        @Size(max = 100, message = "Language must not exceed 100 characters")
        String language,

        @NotNull(message = "Watched status is required")
        Boolean watched,

        @DecimalMin(
                value = "0.0",
                message = "Personal rating must be at least 0.0"
        )
        @DecimalMax(
                value = "10.0",
                message = "Personal rating must not exceed 10.0"
        )
        Double personalRating,

        @NotBlank(message = "File path is required")
        @Size(max = 1000, message = "File path must not exceed 1000 characters")
        String filePath,

        @Size(max = 2000, message = "Notes must not exceed 2000 characters")
        String notes
) {
}
