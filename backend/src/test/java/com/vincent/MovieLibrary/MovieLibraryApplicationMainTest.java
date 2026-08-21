package com.vincent.MovieLibrary;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockStatic;

class MovieLibraryApplicationMainTest {

    @Test
    void applicationClassCanBeConstructed() {
        assertThat(new MovieLibraryApplication()).isNotNull();
    }

    @Test
    void mainDelegatesToSpringApplication() {
        String[] arguments = {"--spring.main.web-application-type=none"};

        try (MockedStatic<SpringApplication> springApplication =
                     mockStatic(SpringApplication.class)) {
            MovieLibraryApplication.main(arguments);

            springApplication.verify(() -> SpringApplication.run(
                    MovieLibraryApplication.class, arguments));
        }
    }
}
