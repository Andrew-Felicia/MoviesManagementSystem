package com.vincent.MovieLibrary.entity;

import jakarta.persistence.*; //JPA(ORM)
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;//Lombok generates those methods during compilation.

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

//this class is used for ORM.

//@Entity,When Spring starts, it scans all your classes, find this,
//it knows: "This class represents a database entity."
//Without @Entity, Hibernate ignores the class.
@Getter
@Setter
@Entity
@Table(name = "movies")
public class Movie {
    //these variables below corresponds to postgresql table.

    //these two annotation:"Don't set this yourself. Let PostgreSQL generate it."
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; //we don't use int here,because id maybe null.

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotNull(message = "Release year is required")
    @Min(value = 1888, message = "Release year must be 1888 or later")
    @Max(value = 2100, message = "Release year must not exceed 2100")
    @Column(name = "release_year")
    private Integer releaseYear;

    @NotBlank(message = "Director is required")
    @Size(max = 150, message = "Director must not exceed 150 characters")
    private String director;

    @NotBlank(message = "Genre is required")
    @Size(max = 100, message = "Genre must not exceed 100 characters")
    private String genre;

    @NotNull(message = "Runtime is required")
    @Min(value = 1, message = "Runtime must be at least 1 minute")
    @Max(value = 1000, message = "Runtime must not exceed 1000 minutes")
    @Column(name = "runtime_minutes")
    private Integer runtimeMinutes;

    @NotBlank(message = "Language is required")
    @Size(max = 100, message = "Language must not exceed 100 characters")
    private String language;

    @NotNull(message = "Watched status is required")
    private Boolean watched;

    @DecimalMin(
            value = "0.0",
            message = "Personal rating must be at least 0.0"
    )
    @DecimalMax(
            value = "10.0",
            message = "Personal rating must not exceed 10.0"
    )
    @Column(name = "personal_rating")
    private Double personalRating;

    @NotBlank(message = "File path is required")
    @Size(max = 1000, message = "File path must not exceed 1000 characters")
    @Column(name = "file_path")
    private String filePath;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;

    @Column(
            name = "created_at",
            insertable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

}
