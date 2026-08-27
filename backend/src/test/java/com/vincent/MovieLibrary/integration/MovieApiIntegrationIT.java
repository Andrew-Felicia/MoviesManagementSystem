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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class MovieApiIntegrationIT {

    private static final String CREATE_JSON = """
            {
              "title": "Interstellar",
              "releaseYear": 2014,
              "director": "Christopher Nolan",
              "genre": "Science Fiction",
              "runtimeMinutes": 169,
              "language": "English",
              "watched": true,
              "personalRating": 9.8,
              "filePath": "/movies/interstellar.mkv",
              "notes": "Amazing soundtrack."
            }
            """;

    private static final String UPDATE_JSON = """
            {
              "title": "Interstellar: Updated",
              "releaseYear": 2014,
              "director": "Christopher Nolan",
              "genre": "Science Fiction",
              "runtimeMinutes": 170,
              "language": "English",
              "watched": false,
              "personalRating": 9.5,
              "filePath": "/movies/interstellar-updated.mkv",
              "notes": "Updated notes."
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MovieRepository movieRepository;

    @BeforeEach
    void clearDatabase() {
        movieRepository.deleteAll();
    }

    @Test
    void completeCrudLifecycleWorksAcrossAllLayers() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CREATE_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Interstellar"));

        Movie created = movieRepository.findAll().getFirst();
        Integer id = created.getId();

        mockMvc.perform(get("/api/movies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(id));

        mockMvc.perform(get("/api/movies/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Interstellar"))
                .andExpect(jsonPath("$.personalRating").value(9.8));

        mockMvc.perform(put("/api/movies/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATE_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.title").value("Interstellar: Updated"))
                .andExpect(jsonPath("$.watched").value(false));

        mockMvc.perform(get("/api/movies/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.runtimeMinutes").value(170))
                .andExpect(jsonPath("$.notes").value("Updated notes."));

        mockMvc.perform(delete("/api/movies/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/movies/{id}", id))
                .andExpect(status().isNotFound());
        org.assertj.core.api.Assertions.assertThat(movieRepository.count()).isZero();
    }

    @Test
    void validationFailureDoesNotWriteToDatabase() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.title").exists());

        org.assertj.core.api.Assertions.assertThat(movieRepository.count()).isZero();
    }

    @Test
    void optionalNullValuesRoundTripThroughApiAndDatabase() throws Exception {
        String request = """
                {
                  "title": "Unrated",
                  "releaseYear": 2026,
                  "director": "Director",
                  "genre": "Drama",
                  "runtimeMinutes": 90,
                  "language": "English",
                  "watched": false,
                  "personalRating": null,
                  "filePath": "/movies/unrated.mkv",
                  "notes": null
                }
                """;

        mockMvc.perform(post("/api/movies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.personalRating").doesNotExist())
                .andExpect(jsonPath("$.notes").doesNotExist());

        Movie saved = movieRepository.findAll().getFirst();
        org.assertj.core.api.Assertions.assertThat(saved.getPersonalRating()).isNull();
        org.assertj.core.api.Assertions.assertThat(saved.getNotes()).isNull();
    }

    @Test
    void batchImportPersistsUniqueMoviesAndReportsDuplicates() throws Exception {
        String request = """
                {
                  "movies": [
                    {
                      "title": "Arrival",
                      "releaseYear": 2016,
                      "director": "Denis Villeneuve",
                      "genre": "Science Fiction",
                      "runtimeMinutes": 116,
                      "language": "English",
                      "watched": true,
                      "personalRating": 9.0,
                      "filePath": "/movies/arrival.mkv",
                      "notes": "Imported from CSV"
                    },
                    {
                      "title": " arrival ",
                      "releaseYear": 2016,
                      "director": "Denis Villeneuve",
                      "genre": "Science Fiction",
                      "runtimeMinutes": 116,
                      "language": "English",
                      "watched": true,
                      "personalRating": 9.0,
                      "filePath": " /MOVIES/ARRIVAL.MKV ",
                      "notes": "Duplicate row"
                    },
                    {
                      "title": "Spirited Away",
                      "releaseYear": 2001,
                      "director": "Hayao Miyazaki",
                      "genre": "Animation",
                      "runtimeMinutes": 125,
                      "language": "Japanese",
                      "watched": false,
                      "personalRating": null,
                      "filePath": "/movies/spirited-away.mkv",
                      "notes": null
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/movies/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(2))
                .andExpect(jsonPath("$.skippedDuplicates").value(1))
                .andExpect(jsonPath("$.movies", hasSize(2)))
                .andExpect(jsonPath("$.movies[0].title").value("Arrival"))
                .andExpect(jsonPath("$.movies[1].title").value("Spirited Away"));

        org.assertj.core.api.Assertions.assertThat(movieRepository.count()).isEqualTo(2);
    }
}
