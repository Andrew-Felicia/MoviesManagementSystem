package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.MovieBatchRequest;
import com.vincent.MovieLibrary.dto.MovieBatchOperationResponse;
import com.vincent.MovieLibrary.dto.MovieBatchResponse;
import com.vincent.MovieLibrary.dto.MovieRequest;
import com.vincent.MovieLibrary.dto.MovieResponse;
import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.exception.MovieNotFoundException;
import com.vincent.MovieLibrary.repository.MovieRepository;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MovieServiceTest {

    private static final LocalDateTime CREATED_AT =
            LocalDateTime.of(2026, 8, 21, 10, 30);
    private static final String USERNAME = "alice";

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    private MovieService movieService;

    @BeforeEach
    void setUp() {
        movieService = new MovieService(movieRepository, userAccountRepository);
    }

    @Test
    void getAllMoviesReturnsMappedResponses() {
        Movie first = movie(1, "Interstellar", 2014, true, 9.8);
        Movie second = movie(2, "Arrival", 2016, false, null);
        when(movieRepository.findAllByOwner_UsernameIgnoreCase(USERNAME)).thenReturn(List.of(first, second));

        List<MovieResponse> result = movieService.getAllMovies(USERNAME);

        assertThat(result).containsExactly(response(first), response(second));
    }

    @Test
    void getAllMoviesReturnsEmptyListWhenRepositoryIsEmpty() {
        when(movieRepository.findAllByOwner_UsernameIgnoreCase(USERNAME)).thenReturn(List.of());

        assertThat(movieService.getAllMovies(USERNAME)).isEmpty();
    }

    @Test
    void getMovieByIdReturnsMappedResponse() {
        Movie movie = movie(7, "Dune", 2021, true, 8.7);
        when(movieRepository.findByIdAndOwner_UsernameIgnoreCase(7, USERNAME)).thenReturn(Optional.of(movie));

        assertThat(movieService.getMovieById(USERNAME, 7)).isEqualTo(response(movie));
    }

    @Test
    void getMovieByIdThrowsWhenMovieDoesNotExist() {
        when(movieRepository.findByIdAndOwner_UsernameIgnoreCase(404, USERNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> movieService.getMovieById(USERNAME, 404))
                .isInstanceOf(MovieNotFoundException.class)
                .hasMessage("Movie not found with id: 404");
    }

    @Test
    void createMovieCopiesEveryRequestFieldAndReturnsSavedMovie() {
        MovieRequest request = request("Blade Runner", 1982, false, 9.1,
                "A visual classic.");
        UserAccount owner = stubOwner();
        when(movieRepository.save(any(Movie.class))).thenAnswer(invocation -> {
            Movie saved = invocation.getArgument(0);
            saved.setId(12);
            saved.setCreatedAt(CREATED_AT);
            return saved;
        });

        MovieResponse result = movieService.createMovie(USERNAME, request);

        ArgumentCaptor<Movie> captor = ArgumentCaptor.forClass(Movie.class);
        verify(movieRepository).save(captor.capture());
        assertThat(captor.getValue().getOwner()).isSameAs(owner);
        assertMovieMatchesRequest(captor.getValue(), request);
        assertThat(result.id()).isEqualTo(12);
        assertThat(result.createdAt()).isEqualTo(CREATED_AT);
        assertResponseMatchesRequest(result, request);
    }

    @Test
    void createMovieSupportsOptionalRatingAndNotes() {
        MovieRequest request = request("Unwatched", 2025, false, null, null);
        stubOwner();
        when(movieRepository.save(any(Movie.class))).thenAnswer(invocation -> {
            Movie saved = invocation.getArgument(0);
            saved.setId(13);
            return saved;
        });

        MovieResponse result = movieService.createMovie(USERNAME, request);

        assertThat(result.personalRating()).isNull();
        assertThat(result.notes()).isNull();
    }

    @Test
    void createMoviesImportsUniqueRowsAndSkipsExistingAndBatchDuplicates() {
        Movie existing = movie(1, "Blade Runner", 1982, true, 9.0);
        existing.setFilePath("/movies/blade-runner.mkv");
        MovieRequest existingDuplicate = request(
                " blade runner ", 1982, true, 9.0, null);
        existingDuplicate = new MovieRequest(
                existingDuplicate.title(), existingDuplicate.releaseYear(),
                existingDuplicate.director(), existingDuplicate.genre(),
                existingDuplicate.runtimeMinutes(), existingDuplicate.language(),
                existingDuplicate.watched(), existingDuplicate.personalRating(),
                " /MOVIES/BLADE-RUNNER.MKV ", existingDuplicate.notes());
        MovieRequest unique = request("Arrival", 2016, false, 8.8, "First contact");
        MovieRequest repeatedUnique = request("ARRIVAL", 2016, false, 8.8, null);

        UserAccount owner = stubOwner();
        when(movieRepository.findAllByOwner_UsernameIgnoreCase(USERNAME)).thenReturn(List.of(existing));
        when(movieRepository.saveAll(any())).thenAnswer(invocation -> {
            List<Movie> saved = invocation.getArgument(0);
            saved.getFirst().setId(20);
            return saved;
        });

        MovieBatchResponse result = movieService.createMovies(USERNAME,
                new MovieBatchRequest(List.of(existingDuplicate, unique, repeatedUnique))
        );

        assertThat(result.importedCount()).isEqualTo(1);
        assertThat(result.skippedDuplicates()).isEqualTo(2);
        assertThat(result.movies()).extracting(MovieResponse::title)
                .containsExactly("Arrival");
        assertThat(result.movies()).hasSize(1);
        ArgumentCaptor<List<Movie>> moviesCaptor = ArgumentCaptor.forClass(List.class);
        verify(movieRepository).saveAll(moviesCaptor.capture());
        assertThat(moviesCaptor.getValue()).allMatch(movie -> movie.getOwner() == owner);
    }

    @Test
    void createMoviesSupportsABatchWithNoDuplicates() {
        MovieRequest first = request("Arrival", 2016, false, null, null);
        MovieRequest second = request("Dune", 2021, true, 8.9, "Epic");
        stubOwner();
        when(movieRepository.findAllByOwner_UsernameIgnoreCase(USERNAME)).thenReturn(List.of());
        when(movieRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        MovieBatchResponse result = movieService.createMovies(USERNAME,
                new MovieBatchRequest(List.of(first, second))
        );

        assertThat(result.importedCount()).isEqualTo(2);
        assertThat(result.skippedDuplicates()).isZero();
        assertThat(result.movies()).extracting(MovieResponse::title)
                .containsExactly("Arrival", "Dune");
    }

    @Test
    void updateMovieReplacesMutableFieldsAndKeepsIdentity() {
        Movie existing = movie(3, "Old title", 1990, false, 4.0);
        MovieRequest request = request("New title", 2020, true, 8.4,
                "Updated notes");
        when(movieRepository.findByIdAndOwner_UsernameIgnoreCase(3, USERNAME)).thenReturn(Optional.of(existing));
        when(movieRepository.save(existing)).thenReturn(existing);

        MovieResponse result = movieService.updateMovie(USERNAME, 3, request);

        verify(movieRepository).save(existing);
        assertMovieMatchesRequest(existing, request);
        assertThat(result.id()).isEqualTo(3);
        assertThat(result.createdAt()).isEqualTo(CREATED_AT);
        assertResponseMatchesRequest(result, request);
    }

    @Test
    void updateMovieDoesNotSaveWhenMovieIsMissing() {
        when(movieRepository.findByIdAndOwner_UsernameIgnoreCase(88, USERNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> movieService.updateMovie(
                USERNAME, 88, request("Missing", 2020, false, null, null)))
                .isInstanceOf(MovieNotFoundException.class);
        verify(movieRepository, never()).save(any());
    }

    @Test
    void deleteMovieDeletesTheExistingEntity() {
        Movie movie = movie(5, "Delete me", 2001, true, 6.0);
        when(movieRepository.findByIdAndOwner_UsernameIgnoreCase(5, USERNAME)).thenReturn(Optional.of(movie));

        movieService.deleteMovie(USERNAME, 5);

        verify(movieRepository).delete(movie);
    }

    @Test
    void deleteMovieDoesNotDeleteWhenMovieIsMissing() {
        when(movieRepository.findByIdAndOwner_UsernameIgnoreCase(99, USERNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> movieService.deleteMovie(USERNAME, 99))
                .isInstanceOf(MovieNotFoundException.class);
        verify(movieRepository, never()).delete(any());
    }

    @Test
    void batchActionsDelegateToOwnerScopedRepositoryOperations() {
        when(movieRepository.markAllWatchedByOwnerUsername(USERNAME)).thenReturn(3);
        when(movieRepository.markAllUnwatchedByOwnerUsername(USERNAME)).thenReturn(2);
        when(movieRepository.deleteAllByOwnerUsername(USERNAME)).thenReturn(5);

        assertThat(movieService.markAllMoviesWatched(USERNAME))
                .isEqualTo(new MovieBatchOperationResponse(3));
        assertThat(movieService.markAllMoviesUnwatched(USERNAME))
                .isEqualTo(new MovieBatchOperationResponse(2));
        assertThat(movieService.deleteAllMovies(USERNAME))
                .isEqualTo(new MovieBatchOperationResponse(5));

        verify(movieRepository).markAllWatchedByOwnerUsername(USERNAME);
        verify(movieRepository).markAllUnwatchedByOwnerUsername(USERNAME);
        verify(movieRepository).deleteAllByOwnerUsername(USERNAME);
    }

    @Test
    void createMovieFailsIfAuthenticatedAccountWasRemoved() {
        when(userAccountRepository.findByUsernameIgnoreCase(USERNAME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> movieService.createMovie(
                USERNAME, request("Orphan", 2020, false, null, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Authenticated account no longer exists");
        verify(movieRepository, never()).save(any());
    }

    private UserAccount stubOwner() {
        UserAccount owner = new UserAccount();
        owner.setId(42L);
        owner.setUsername(USERNAME);
        when(userAccountRepository.findByUsernameIgnoreCase(USERNAME)).thenReturn(Optional.of(owner));
        return owner;
    }

    private static Movie movie(
            Integer id,
            String title,
            Integer releaseYear,
            Boolean watched,
            Double rating
    ) {
        Movie movie = new Movie();
        movie.setId(id);
        movie.setTitle(title);
        movie.setReleaseYear(releaseYear);
        movie.setDirector("Director " + id);
        movie.setGenre("Drama");
        movie.setRuntimeMinutes(120);
        movie.setLanguage("English");
        movie.setWatched(watched);
        movie.setPersonalRating(rating);
        movie.setFilePath("/movies/" + id + ".mkv");
        movie.setNotes("Notes " + id);
        movie.setCreatedAt(CREATED_AT);
        return movie;
    }

    private static MovieRequest request(
            String title,
            Integer year,
            Boolean watched,
            Double rating,
            String notes
    ) {
        return new MovieRequest(
                title,
                year,
                "Ridley Scott",
                "Science Fiction",
                117,
                "English",
                watched,
                rating,
                "/movies/" + title + ".mkv",
                notes
        );
    }

    private static MovieResponse response(Movie movie) {
        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getReleaseYear(),
                movie.getDirector(),
                movie.getGenre(),
                movie.getRuntimeMinutes(),
                movie.getLanguage(),
                movie.getWatched(),
                movie.getPersonalRating(),
                movie.getFilePath(),
                movie.getNotes(),
                movie.getCreatedAt()
        );
    }

    private static void assertMovieMatchesRequest(
            Movie movie,
            MovieRequest request
    ) {
        assertThat(movie.getTitle()).isEqualTo(request.title());
        assertThat(movie.getReleaseYear()).isEqualTo(request.releaseYear());
        assertThat(movie.getDirector()).isEqualTo(request.director());
        assertThat(movie.getGenre()).isEqualTo(request.genre());
        assertThat(movie.getRuntimeMinutes()).isEqualTo(request.runtimeMinutes());
        assertThat(movie.getLanguage()).isEqualTo(request.language());
        assertThat(movie.getWatched()).isEqualTo(request.watched());
        assertThat(movie.getPersonalRating()).isEqualTo(request.personalRating());
        assertThat(movie.getFilePath()).isEqualTo(request.filePath());
        assertThat(movie.getNotes()).isEqualTo(request.notes());
    }

    private static void assertResponseMatchesRequest(
            MovieResponse response,
            MovieRequest request
    ) {
        assertThat(response.title()).isEqualTo(request.title());
        assertThat(response.releaseYear()).isEqualTo(request.releaseYear());
        assertThat(response.director()).isEqualTo(request.director());
        assertThat(response.genre()).isEqualTo(request.genre());
        assertThat(response.runtimeMinutes()).isEqualTo(request.runtimeMinutes());
        assertThat(response.language()).isEqualTo(request.language());
        assertThat(response.watched()).isEqualTo(request.watched());
        assertThat(response.personalRating()).isEqualTo(request.personalRating());
        assertThat(response.filePath()).isEqualTo(request.filePath());
        assertThat(response.notes()).isEqualTo(request.notes());
    }
}
