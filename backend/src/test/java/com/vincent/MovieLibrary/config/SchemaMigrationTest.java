package com.vincent.MovieLibrary.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import java.sql.DriverManager;
import static org.assertj.core.api.Assertions.assertThat;

class SchemaMigrationTest {
    @Test
    void existingCatalogGainsPosterColumnWithoutLosingRowsAndCanRestart() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:poster_migration;MODE=PostgreSQL")) {
            try (var statement = connection.createStatement()) {
                statement.execute("CREATE TABLE movies (id SERIAL PRIMARY KEY, title VARCHAR(255))");
                statement.execute("INSERT INTO movies (title) VALUES ('Existing movie')");
            }
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("schema.sql"));
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("schema.sql"));
            try (var statement = connection.createStatement(); var rows = statement.executeQuery(
                    "SELECT title, poster_url, synopsis, cast_members, imdb_url, trailer_url FROM movies")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString("title")).isEqualTo("Existing movie");
                assertThat(rows.getString("poster_url")).isNull();
                assertThat(rows.getString("synopsis")).isNull();
                assertThat(rows.getString("cast_members")).isNull();
                assertThat(rows.getString("imdb_url")).isNull();
                assertThat(rows.getString("trailer_url")).isNull();
                assertThat(rows.next()).isFalse();
            }
        }
    }
}
