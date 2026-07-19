package com.vincent.MovieLibrary.repository;

import com.vincent.MovieLibrary.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository
        extends JpaRepository<Movie, Integer> {

}
