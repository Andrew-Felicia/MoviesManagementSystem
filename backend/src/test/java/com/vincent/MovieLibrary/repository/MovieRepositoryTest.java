package com.vincent.MovieLibrary.repository;

import com.vincent.MovieLibrary.entity.Movie;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
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
    private EntityManager entityManager;

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

    private static Movie movie(
            String title,
            Integer releaseYear,
            Boolean watched,
            Double rating
    ) {
        Movie movie = new Movie();
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
