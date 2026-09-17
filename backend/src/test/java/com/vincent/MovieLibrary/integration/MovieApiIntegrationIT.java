package com.vincent.MovieLibrary.integration;

import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.repository.MovieRepository;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import com.vincent.MovieLibrary.service.PosterStorageService;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

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

    private static final Authentication ADMIN = new TestingAuthenticationToken("admin", "unused");
    private static final Authentication ALICE = new TestingAuthenticationToken("alice", "unused");

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

    @Autowired
    private UserAccountRepository userAccountRepository;

    @MockitoSpyBean
    private PosterStorageService posterStorageService;

    @BeforeEach
    void clearDatabase() {
        movieRepository.deleteAll();
    }

    @Test
    void postersPersistForManualAndBatchImportsAndRemainPrivate() throws Exception {
        String image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=";
        org.mockito.Mockito.doReturn(image).when(posterStorageService).store("https://example.com/poster.jpg");
        String withUpload = CREATE_JSON.replace("\"notes\":", "\"posterUrl\": \"" + image + "\", \"notes\":");
        mockMvc.perform(post("/api/movies").principal(ADMIN).contentType(MediaType.APPLICATION_JSON).content(withUpload))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.posterUrl").value(image));
        Movie created = movieRepository.findAll().getFirst();
        org.assertj.core.api.Assertions.assertThat(created.getPosterUrl()).isEqualTo(image);
        mockMvc.perform(get("/api/movies/{id}", created.getId()).principal(ADMIN))
                .andExpect(status().isOk()).andExpect(jsonPath("$.posterUrl").value(image));
        mockMvc.perform(get("/api/movies/{id}", created.getId()).principal(ALICE))
                .andExpect(status().isNotFound());

        String withUrl = UPDATE_JSON.replace("\"notes\":", "\"posterUrl\": \"https://example.com/poster.jpg\", \"notes\":");
        mockMvc.perform(post("/api/movies/batch").principal(ADMIN).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"movies\":[" + withUrl + "]}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.movies[0].posterUrl").value(image));
        mockMvc.perform(get("/api/movies").principal(ADMIN))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(put("/api/movies/{id}", created.getId()).principal(ADMIN).contentType(MediaType.APPLICATION_JSON).content(withUrl))
                .andExpect(status().isOk()).andExpect(jsonPath("$.posterUrl").value(image));
        mockMvc.perform(put("/api/movies/{id}", created.getId()).principal(ADMIN).contentType(MediaType.APPLICATION_JSON).content(UPDATE_JSON))
                .andExpect(status().isOk()).andExpect(jsonPath("$.posterUrl").doesNotExist());
        org.assertj.core.api.Assertions.assertThat(movieRepository.findById(created.getId()).orElseThrow().getPosterUrl()).isNull();
    }

    @Test
    void legacyPosterConversionIsOwnerScopedAndStoredInDatabase() throws Exception {
        ensureUser("alice");
        String image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=";
        org.mockito.Mockito.doReturn(image).when(posterStorageService).store("https://example.com/legacy.png");
        mockMvc.perform(post("/api/movies").principal(ADMIN).contentType(MediaType.APPLICATION_JSON).content(CREATE_JSON)).andExpect(status().isCreated());
        mockMvc.perform(post("/api/movies").principal(ALICE).contentType(MediaType.APPLICATION_JSON).content(CREATE_JSON)).andExpect(status().isCreated());
        for (Movie movie : movieRepository.findAll()) {
            movie.setPosterUrl("https://example.com/legacy.png");
            movieRepository.save(movie);
        }
        mockMvc.perform(post("/api/movies/posters/localize").principal(ADMIN))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].posterUrl").value(image));
        assertStoredPoster("admin", image);
        assertStoredPoster("alice", "https://example.com/legacy.png");
        mockMvc.perform(post("/api/movies/posters/localize").principal(ADMIN)).andExpect(status().isOk());
        org.mockito.Mockito.verify(posterStorageService, org.mockito.Mockito.times(1)).store("https://example.com/legacy.png");
    }

    @Test
    void failedPosterImportRollsBackEntireBatchAndInvalidUpdatePreservesMovie() throws Exception {
        String invalid = CREATE_JSON.replace("\"notes\":", "\"posterUrl\": \"http://127.0.0.1/private\", \"notes\":").replace("Interstellar", "Bad poster");
        mockMvc.perform(post("/api/movies/batch").principal(ADMIN).contentType(MediaType.APPLICATION_JSON)
                .content("{\"movies\":[" + CREATE_JSON + "," + invalid + "]}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.posterUrl").exists());
        org.assertj.core.api.Assertions.assertThat(movieRepository.count()).isZero();
        mockMvc.perform(post("/api/movies").principal(ADMIN).contentType(MediaType.APPLICATION_JSON).content(CREATE_JSON)).andExpect(status().isCreated());
        Movie movie = movieRepository.findAll().getFirst();
        mockMvc.perform(put("/api/movies/{id}", movie.getId()).principal(ADMIN).contentType(MediaType.APPLICATION_JSON).content(invalid))
                .andExpect(status().isBadRequest());
        org.assertj.core.api.Assertions.assertThat(movieRepository.findById(movie.getId()).orElseThrow().getTitle()).isEqualTo("Interstellar");
        mockMvc.perform(post("/api/movies/posters/localize").principal(ADMIN)).andExpect(status().isOk());
    }

    private void assertStoredPoster(String username, String expected) {
        org.assertj.core.api.Assertions.assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase(username).getFirst().getPosterUrl()).isEqualTo(expected);
    }

    @Test
    void completeCrudLifecycleWorksAcrossAllLayers() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CREATE_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Interstellar"));

        Movie created = movieRepository.findAll().getFirst();
        Integer id = created.getId();

        mockMvc.perform(get("/api/movies").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(id));

        mockMvc.perform(get("/api/movies/{id}", id).principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Interstellar"))
                .andExpect(jsonPath("$.personalRating").value(9.8));

        mockMvc.perform(put("/api/movies/{id}", id)
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATE_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.title").value("Interstellar: Updated"))
                .andExpect(jsonPath("$.watched").value(false));

        mockMvc.perform(get("/api/movies/{id}", id).principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.runtimeMinutes").value(170))
                .andExpect(jsonPath("$.notes").value("Updated notes."));

        mockMvc.perform(delete("/api/movies/{id}", id).principal(ADMIN))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/movies/{id}", id).principal(ADMIN))
                .andExpect(status().isNotFound());
        org.assertj.core.api.Assertions.assertThat(movieRepository.count()).isZero();
    }

    @Test
    void validationFailureDoesNotWriteToDatabase() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .principal(ADMIN)
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
                        .principal(ADMIN)
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
                        .principal(ADMIN)
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

    @Test
    void usersCanOnlyReadAndModifyTheirOwnMovies() throws Exception {
        ensureUser("alice");

        mockMvc.perform(post("/api/movies")
                        .principal(ALICE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CREATE_JSON))
                .andExpect(status().isCreated());

        Movie aliceMovie = movieRepository.findAllByOwner_UsernameIgnoreCase("alice").getFirst();
        mockMvc.perform(get("/api/movies").principal(ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/movies").principal(ALICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Interstellar"));
        mockMvc.perform(get("/api/movies/{id}", aliceMovie.getId()).principal(ADMIN))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/movies/{id}", aliceMovie.getId())
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(UPDATE_JSON))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/movies/{id}", aliceMovie.getId()).principal(ADMIN))
                .andExpect(status().isNotFound());
        org.assertj.core.api.Assertions.assertThat(movieRepository.findById(aliceMovie.getId())).isPresent();
    }

    @Test
    void batchActionsOnlyChangeTheSignedInUsersLibrary() throws Exception {
        ensureUser("alice");
        String unwatchedRequest = CREATE_JSON.replace("\"watched\": true", "\"watched\": false");

        mockMvc.perform(post("/api/movies")
                        .principal(ALICE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unwatchedRequest))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/movies")
                        .principal(ALICE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unwatchedRequest.replace("Interstellar", "Arrival")))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/movies")
                        .principal(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unwatchedRequest.replace("Interstellar", "Dune")))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/movies/batch/watched").principal(ALICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedCount").value(2));
        org.assertj.core.api.Assertions.assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("alice"))
                .allMatch(Movie::getWatched);
        org.assertj.core.api.Assertions.assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("admin"))
                .allMatch(movie -> !movie.getWatched());

        mockMvc.perform(put("/api/movies/batch/unwatched").principal(ALICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedCount").value(2));
        org.assertj.core.api.Assertions.assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("alice"))
                .allMatch(movie -> !movie.getWatched());
        org.assertj.core.api.Assertions.assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("admin"))
                .allMatch(movie -> !movie.getWatched());

        mockMvc.perform(delete("/api/movies/batch").principal(ALICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedCount").value(2));
        mockMvc.perform(delete("/api/movies/batch").principal(ALICE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.affectedCount").value(0));
        org.assertj.core.api.Assertions.assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("alice")).isEmpty();
        org.assertj.core.api.Assertions.assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("admin"))
                .extracting(Movie::getTitle)
                .containsExactly("Dune");
    }

    private void ensureUser(String username) {
        userAccountRepository.findByUsernameIgnoreCase(username).orElseGet(() -> {
            UserAccount account = new UserAccount();
            account.setUsername(username);
            account.setPasswordHash("test-hash");
            account.setRole("USER");
            account.setEnabled(true);
            account.setCreatedAt(LocalDateTime.now());
            return userAccountRepository.save(account);
        });
    }
}
