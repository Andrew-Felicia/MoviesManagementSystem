package com.vincent.MovieLibrary.entity;

import jakarta.persistence.*; //JPA(ORM)
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;//Lombok generates those methods during compilation.


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

    private String title;

    @Column(name = "release_year")
    private Integer releaseYear;

    private String director;

    private String genre;

    @Column(name = "runtime_minutes")
    private Integer runtimeMinutes;

    private String language;

    private Boolean watched;

    @Column(name = "personal_rating")
    private Double personalRating;

    @Column(name = "file_path")
    private String filePath;

    private String notes;

    @Column(
            name = "created_at",
            insertable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

}
