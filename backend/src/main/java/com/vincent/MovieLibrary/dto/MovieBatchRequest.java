package com.vincent.MovieLibrary.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MovieBatchRequest(
        @NotEmpty(message = "At least one movie is required")
        @Size(max = 5000, message = "A batch must not exceed 5000 movies")
        List<@Valid MovieRequest> movies
) {
}
