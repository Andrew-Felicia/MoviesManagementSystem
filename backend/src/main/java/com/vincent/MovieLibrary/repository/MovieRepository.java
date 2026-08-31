package com.vincent.MovieLibrary.repository;

import com.vincent.MovieLibrary.entity.Movie;
import com.vincent.MovieLibrary.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface MovieRepository
        extends JpaRepository<Movie, Integer> {

    List<Movie> findAllByOwner_UsernameIgnoreCase(String username);

    Optional<Movie> findByIdAndOwner_UsernameIgnoreCase(Integer id, String username);

    @Modifying
    @Transactional
    @Query("""
            update Movie movie
            set movie.watched = true
            where upper(movie.owner.username) = upper(:username)
              and (movie.watched = false or movie.watched is null)
            """)
    int markAllWatchedByOwnerUsername(String username);

    @Modifying
    @Transactional
    @Query("""
            update Movie movie
            set movie.watched = false
            where upper(movie.owner.username) = upper(:username)
              and movie.watched = true
            """)
    int markAllUnwatchedByOwnerUsername(String username);

    @Modifying
    @Transactional
    @Query("""
            delete from Movie movie
            where upper(movie.owner.username) = upper(:username)
            """)
    int deleteAllByOwnerUsername(String username);

    @Modifying
    @Transactional
    @Query("update Movie movie set movie.owner = :owner where movie.owner is null")
    int assignUnownedMoviesTo(UserAccount owner);

    @Modifying
    @Transactional
    @Query(value = "ALTER TABLE movies ALTER COLUMN user_id SET NOT NULL", nativeQuery = true)
    void enforceOwnerRequired();

}
