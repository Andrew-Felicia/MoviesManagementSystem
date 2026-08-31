package com.vincent.MovieLibrary.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminPasswordResetRequest(
        @NotBlank(message = "New passcode is required")
        String newPasscode
) {
}
