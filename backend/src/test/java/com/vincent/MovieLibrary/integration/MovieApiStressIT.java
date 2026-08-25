package com.vincent.MovieLibrary.integration;

import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.repository.MovieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertTimeout;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class MovieApiStressIT {

    private static final int MOVIE_COUNT = 250;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MovieRepository movieRepository;

    @BeforeEach
    void clearDatabase() {
        movieRepository.deleteAll();
    }

    @Test
    void everyEndpointHandlesRepeatedOperations() {
        assertTimeout(Duration.ofSeconds(90), () -> {
            for (int i = 0; i < MOVIE_COUNT; i++) {
                mockMvc.perform(post("/api/movies")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson("Stress " + i, false)))
                        .andExpect(status().isCreated());
            }

            mockMvc.perform(get("/api/movies"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(MOVIE_COUNT)));

            List<Integer> ids = movieRepository.findAll().stream()
                    .map(Movie::getId)
                    .toList();
            assertThat(ids).hasSize(MOVIE_COUNT);

            for (Integer id : ids) {
                mockMvc.perform(get("/api/movies/{id}", id))
                        .andExpect(status().isOk());
            }

            for (int i = 0; i < ids.size(); i++) {
                mockMvc.perform(put("/api/movies/{id}", ids.get(i))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson("Updated " + i, true)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.watched").value(true));
            }

            for (Integer id : ids) {
                mockMvc.perform(delete("/api/movies/{id}", id))
                        .andExpect(status().isNoContent());
            }

            assertThat(movieRepository.count()).isZero();
        });
    }

    private static String requestJson(String title, boolean watched) {
        return """
                {
                  "title": "%s",
                  "releaseYear": 2026,
                  "director": "Load Test Director",
                  "genre": "Drama",
                  "runtimeMinutes": 100,
                  "language": "English",
                  "watched": %s,
                  "personalRating": 8.0,
                  "filePath": "/movies/stress.mkv",
                  "notes": "Stress test"
                }
                """.formatted(title, watched);
    }
}
