package com.vincent.MovieLibrary.dto;

import java.time.LocalDateTime;

/**
 * Safe account information exposed only to administrators. Password hashes are
 * intentionally not included, because a passcode can never be retrieved.
 */
public record AdminUserResponse(
        String username,
        String role,
        LocalDateTime createdAt,
        long movieCount
) {
}
