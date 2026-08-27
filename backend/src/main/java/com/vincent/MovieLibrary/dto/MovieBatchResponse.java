package com.vincent.MovieLibrary.dto;

import java.util.List;

public record MovieBatchResponse(
        int importedCount,
        int skippedDuplicates,
        List<MovieResponse> movies
) {
}
