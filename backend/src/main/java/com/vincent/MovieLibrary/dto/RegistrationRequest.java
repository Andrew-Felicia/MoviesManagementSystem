package com.vincent.MovieLibrary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        @Pattern(
                regexp = "^[A-Za-z0-9._-]+$",
                message = "Username may only contain letters, numbers, dots, underscores, and hyphens"
        )
        String username,

        @NotBlank(message = "Passcode is required")
        String passcode
) {
}
