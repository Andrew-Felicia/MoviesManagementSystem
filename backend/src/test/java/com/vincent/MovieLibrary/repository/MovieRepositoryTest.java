package com.vincent.MovieLibrary.repository;

import com.vincent.MovieLibrary.dto.AdminUserResponse;
import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.entity.UserAccount;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MovieRepositoryTest {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private EntityManager entityManager;

    private UserAccount owner;

    @BeforeEach
    void createOwner() {
        owner = new UserAccount();
        owner.setUsername("repository-user");
        owner.setPasswordHash("test-hash");
        owner.setRole("USER");
        owner.setEnabled(true);
        owner.setCreatedAt(java.time.LocalDateTime.now());
        owner = userAccountRepository.saveAndFlush(owner);
    }

    @Test
    void saveAndFindByIdPersistsEveryMappedField() {
        Movie movie = movie("Interstellar", 2014, true, 9.8);

        Movie saved = movieRepository.saveAndFlush(movie);
        Integer id = saved.getId();
        entityManager.clear();

        Movie found = movieRepository.findById(id).orElseThrow();
        assertThat(found.getId()).isEqualTo(id);
        assertThat(found.getTitle()).isEqualTo("Interstellar");
        assertThat(found.getReleaseYear()).isEqualTo(2014);
        assertThat(found.getDirector()).isEqualTo("Christopher Nolan");
        assertThat(found.getGenre()).isEqualTo("Science Fiction");
        assertThat(found.getRuntimeMinutes()).isEqualTo(169);
        assertThat(found.getLanguage()).isEqualTo("English");
        assertThat(found.getWatched()).isTrue();
        assertThat(found.getPersonalRating()).isEqualTo(9.8);
        assertThat(found.getFilePath()).isEqualTo("/movies/Interstellar.mkv");
        assertThat(found.getNotes()).isEqualTo("Test notes");
        assertThat(found.getOwner().getUsername()).isEqualTo("repository-user");
    }

    @Test
    void generatedIdsAreUnique() {
        Movie first = movieRepository.save(movie("First", 2000, false, null));
        Movie second = movieRepository.save(movie("Second", 2001, false, null));

        assertThat(first.getId()).isNotNull();
        assertThat(second.getId()).isNotNull();
        assertThat(second.getId()).isNotEqualTo(first.getId());
    }

    @Test
    void findAllReturnsAllPersistedMovies() {
        movieRepository.saveAll(List.of(
                movie("Arrival", 2016, true, 9.0),
                movie("Dune", 2021, false, null),
                movie("Tenet", 2020, true, 7.5)
        ));

        assertThat(movieRepository.findAll())
                .extracting(Movie::getTitle)
                .containsExactlyInAnyOrder("Arrival", "Dune", "Tenet");
    }

    @Test
    void updatingMoviePersistsChangedFields() {
        Movie saved = movieRepository.saveAndFlush(
                movie("Original", 1999, false, null));
        saved.setTitle("Updated");
        saved.setWatched(true);
        saved.setPersonalRating(8.6);
        movieRepository.saveAndFlush(saved);
        entityManager.clear();

        Movie updated = movieRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("Updated");
        assertThat(updated.getWatched()).isTrue();
        assertThat(updated.getPersonalRating()).isEqualTo(8.6);
    }

    @Test
    void deleteRemovesMovie() {
        Movie saved = movieRepository.saveAndFlush(
                movie("Delete me", 2005, true, 5.0));
        Integer id = saved.getId();

        movieRepository.delete(saved);
        movieRepository.flush();
        entityManager.clear();

        assertThat(movieRepository.findById(id)).isEmpty();
    }

    @Test
    void nullableOptionalFieldsArePersistedAsNull() {
        Movie movie = movie("Unrated", 2026, false, null);
        movie.setNotes(null);

        Movie saved = movieRepository.saveAndFlush(movie);
        entityManager.clear();

        Movie found = movieRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getPersonalRating()).isNull();
        assertThat(found.getNotes()).isNull();
    }

    @Test
    void ownerScopedQueriesNeverReturnAnotherUsersMovies() {
        movieRepository.saveAndFlush(movie("Private title", 2026, false, null));

        assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("REPOSITORY-USER"))
                .extracting(Movie::getTitle)
                .containsExactly("Private title");
        assertThat(movieRepository.findAllByOwner_UsernameIgnoreCase("someone-else")).isEmpty();
        Integer id = movieRepository.findAll().getFirst().getId();
        assertThat(movieRepository.findByIdAndOwner_UsernameIgnoreCase(id, "someone-else")).isEmpty();
    }

    @Test
    void accountSummariesIncludeEachUsersMovieCount() {
        movieRepository.saveAll(List.of(
                movie("First private movie", 2020, true, 8.0),
                movie("Second private movie", 2021, false, null)
        ));
        UserAccount emptyAccount = new UserAccount();
        emptyAccount.setUsername("empty-account");
        emptyAccount.setPasswordHash("test-hash");
        emptyAccount.setRole("USER");
        emptyAccount.setEnabled(true);
        emptyAccount.setCreatedAt(java.time.LocalDateTime.now());
        userAccountRepository.saveAndFlush(emptyAccount);
        entityManager.clear();

        assertThat(userAccountRepository.findAllWithMovieCounts())
                .extracting(AdminUserResponse::username, AdminUserResponse::movieCount)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("repository-user", 2L),
                        org.assertj.core.groups.Tuple.tuple("empty-account", 0L)
                );
    }

    private Movie movie(
            String title,
            Integer releaseYear,
            Boolean watched,
            Double rating
    ) {
        Movie movie = new Movie();
        movie.setOwner(owner);
        movie.setTitle(title);
        movie.setReleaseYear(releaseYear);
        movie.setDirector("Christopher Nolan");
        movie.setGenre("Science Fiction");
        movie.setRuntimeMinutes(169);
        movie.setLanguage("English");
        movie.setWatched(watched);
        movie.setPersonalRating(rating);
        movie.setFilePath("/movies/" + title + ".mkv");
        movie.setNotes("Test notes");
        return movie;
    }
}
