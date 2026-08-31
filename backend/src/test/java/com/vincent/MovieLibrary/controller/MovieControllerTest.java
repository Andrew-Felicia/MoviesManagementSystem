package com.vincent.MovieLibrary.controller;

import com.vincent.MovieLibrary.dto.MovieBatchRequest;
import com.vincent.MovieLibrary.dto.MovieBatchOperationResponse;
import com.vincent.MovieLibrary.dto.MovieBatchResponse;
import com.vincent.MovieLibrary.dto.MovieRequest;
import com.vincent.MovieLibrary.dto.MovieResponse;
import com.vincent.MovieLibrary.exception.MovieNotFoundException;
import com.vincent.MovieLibrary.service.MovieService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MovieController.class)
@AutoConfigureMockMvc(addFilters = false)
class MovieControllerTest {

    private static final Authentication ADMIN = new TestingAuthenticationToken("admin", "unused");

    private static final String VALID_REQUEST_JSON = """
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

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MovieService movieService;

    @Test
    void getAllMoviesReturnsJsonArray() throws Exception {
        when(movieService.getAllMovies("admin")).thenReturn(List.of(
                response(1, "Interstellar"),
                response(2, "Arrival")
        ));

        mockMvc.perform(get("/api/movies").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Interstellar"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].title").value("Arrival"));
    }

    @Test
    void getAllMoviesAcceptsTrailingSlash() throws Exception {
        when(movieService.getAllMovies("admin")).thenReturn(List.of());

        mockMvc.perform(get("/api/movies/").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getMovieByIdReturnsMovieJson() throws Exception {
        when(movieService.getMovieById("admin", 9)).thenReturn(response(9, "Dune"));

        mockMvc.perform(get("/api/movies/9").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(9))
                .andExpect(jsonPath("$.title").value("Dune"))
                .andExpect(jsonPath("$.releaseYear").value(2014))
                .andExpect(jsonPath("$.watched").value(true))
                .andExpect(jsonPath("$.personalRating").value(9.8));
    }

    @Test
    void getMovieByIdReturns404WhenMovieIsMissing() throws Exception {
        when(movieService.getMovieById("admin", 404))
                .thenThrow(new MovieNotFoundException(404));

        mockMvc.perform(get("/api/movies/404").principal(ADMIN))
                .andExpect(status().isNotFound());
    }

    @Test
    void createMovieReturns201AndResponseBody() throws Exception {
        MovieRequest expectedRequest = validRequest();
        when(movieService.createMovie("admin", expectedRequest))
                .thenReturn(response(11, "Interstellar"));

        mockMvc.perform(post("/api/movies")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.title").value("Interstellar"));

        verify(movieService).createMovie("admin", expectedRequest);
    }

    @Test
    void batchCreateReturnsImportSummary() throws Exception {
        MovieBatchRequest request = new MovieBatchRequest(List.of(validRequest()));
        when(movieService.createMovies("admin", request)).thenReturn(
                new MovieBatchResponse(1, 0, List.of(response(21, "Interstellar")))
        );

        mockMvc.perform(post("/api/movies/batch")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"movies": [%s]}
                                """.formatted(VALID_REQUEST_JSON)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(1))
                .andExpect(jsonPath("$.skippedDuplicates").value(0))
                .andExpect(jsonPath("$.movies[0].title").value("Interstellar"));

        verify(movieService).createMovies("admin", request);
    }

    @Test
    void batchCreateRejectsEmptyAndInvalidBatches() throws Exception {
        mockMvc.perform(post("/api/movies/batch")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movies\": []}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.movies")
                        .value("At least one movie is required"));

        mockMvc.perform(post("/api/movies/batch")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movies\": [{}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['movies[0].title']")
                        .value("Title is required"));

        verify(movieService, never()).createMovies(anyString(), any());
    }

    @Test
    void batchActionsReturnAffectedMovieCounts() throws Exception {
        when(movieService.markAllMoviesWatched("admin"))
                .thenReturn(new MovieBatchOperationResponse(3));
        when(movieService.markAllMoviesUnwatched("admin"))
                .thenReturn(new MovieBatchOperationResponse(2));
        when(movieService.deleteAllMovies("admin"))
                .thenReturn(new MovieBatchOperationResponse(5));

        mockMvc.perform(put("/api/movies/batch/watched").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedCount").value(3));
        mockMvc.perform(put("/api/movies/batch/unwatched").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedCount").value(2));
        mockMvc.perform(delete("/api/movies/batch").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedCount").value(5));

        verify(movieService).markAllMoviesWatched("admin");
        verify(movieService).markAllMoviesUnwatched("admin");
        verify(movieService).deleteAllMovies("admin");
    }

    @Test
    void updateMovieReturnsUpdatedResponse() throws Exception {
        MovieRequest expectedRequest = validRequest();
        when(movieService.updateMovie("admin", 11, expectedRequest))
                .thenReturn(response(11, "Interstellar"));

        mockMvc.perform(put("/api/movies/11")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.title").value("Interstellar"));

        verify(movieService).updateMovie("admin", 11, expectedRequest);
    }

    @Test
    void deleteMovieReturns204() throws Exception {
        mockMvc.perform(delete("/api/movies/6").principal(ADMIN))
                .andExpect(status().isNoContent());

        verify(movieService).deleteMovie("admin", 6);
    }

    @Test
    void deleteMovieReturns404WhenMovieIsMissing() throws Exception {
        org.mockito.Mockito.doThrow(new MovieNotFoundException(6))
                .when(movieService).deleteMovie("admin", 6);

        mockMvc.perform(delete("/api/movies/6").principal(ADMIN))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidRequestReturnsStructuredFieldErrors() throws Exception {
        String invalidJson = """
                {
                  "title": "",
                  "releaseYear": 1800,
                  "director": "",
                  "genre": "",
                  "runtimeMinutes": 0,
                  "language": "",
                  "watched": null,
                  "personalRating": 11.0,
                  "filePath": "",
                  "notes": null
                }
                """;

        mockMvc.perform(post("/api/movies")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.title")
                        .value("Title is required"))
                .andExpect(jsonPath("$.fieldErrors.releaseYear")
                        .value("Release year must be 1888 or later"))
                .andExpect(jsonPath("$.fieldErrors.runtimeMinutes")
                        .value("Runtime must be at least 1 minute"))
                .andExpect(jsonPath("$.fieldErrors.watched")
                        .value("Watched status is required"))
                .andExpect(jsonPath("$.fieldErrors.personalRating")
                        .value("Personal rating must not exceed 10.0"));

        verify(movieService, never()).createMovie(anyString(), any());
    }

    @Test
    void malformedJsonReturns400WithoutCallingService() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not-valid-json"))
                .andExpect(status().isBadRequest());

        verify(movieService, never()).createMovie(anyString(), any());
    }

    @Test
    void nonNumericMovieIdReturns400() throws Exception {
        mockMvc.perform(get("/api/movies/not-a-number").principal(ADMIN))
                .andExpect(status().isBadRequest());

        verify(movieService, never()).getMovieById(anyString(), any());
    }

    @Test
    void unsupportedHttpMethodReturns405() throws Exception {
        mockMvc.perform(patch("/api/movies/1")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REQUEST_JSON))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void requestWithoutJsonContentTypeReturns415() throws Exception {
        mockMvc.perform(post("/api/movies").principal(ADMIN).content(VALID_REQUEST_JSON))
                .andExpect(status().isUnsupportedMediaType());

        verify(movieService, never()).createMovie(anyString(), any());
    }

    @Test
    void optionalNullFieldsAreAccepted() throws Exception {
        String requestJson = """
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
        when(movieService.createMovie(anyString(), any(MovieRequest.class)))
                .thenReturn(new MovieResponse(
                        12, "Unrated", 2026, "Director", "Drama", 90,
                        "English", false, null, "/movies/unrated.mkv",
                        null, null));

        mockMvc.perform(post("/api/movies")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.personalRating").doesNotExist())
                .andExpect(jsonPath("$.notes").doesNotExist());

        verify(movieService).createMovie(anyString(), any(MovieRequest.class));
    }

    @Test
    void invalidUpdateDoesNotCallService() throws Exception {
        mockMvc.perform(put("/api/movies/3")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title")
                        .value("Title is required"));

        verify(movieService, never()).updateMovie(anyString(), any(), any());
    }

    private static MovieRequest validRequest() {
        return new MovieRequest(
                "Interstellar",
                2014,
                "Christopher Nolan",
                "Science Fiction",
                169,
                "English",
                true,
                9.8,
                "/movies/interstellar.mkv",
                "Amazing soundtrack."
        );
    }

    private static MovieResponse response(Integer id, String title) {
        return new MovieResponse(
                id,
                title,
                2014,
                "Christopher Nolan",
                "Science Fiction",
                169,
                "English",
                true,
                9.8,
                "/movies/" + id + ".mkv",
                "Notes",
                LocalDateTime.of(2026, 8, 21, 12, 0)
        );
    }
}
