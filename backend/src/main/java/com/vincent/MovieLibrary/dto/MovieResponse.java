package com.vincent.MovieLibrary.dto;


import java.time.LocalDateTime;

public record MovieResponse(
        Integer id,
        String title,
        Integer releaseYear,
        String director,
        String genre,
        Integer runtimeMinutes,
        String language,
        Boolean watched,
        Double personalRating,
        String filePath,
        String notes,
        String synopsis,
        String castMembers,
        String imdbUrl,
        String trailerUrl,
        LocalDateTime createdAt,
        String posterUrl
) {
}
