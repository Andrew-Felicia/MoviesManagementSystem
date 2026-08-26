package com.vincent.MovieLibrary.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordChangeRequest(
        @NotBlank(message = "Current passcode is required")
        String currentPasscode,

        @NotBlank(message = "New passcode is required")
        String newPasscode
) {
}
