package com.vincent.MovieLibrary.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class UserAccountTest {

    @Test
    void allAccountPropertiesRoundTrip() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 8, 25, 12, 0);
        UserAccount account = new UserAccount();

        account.setId(7L);
        account.setUsername("admin");
        account.setPasswordHash("bcrypt-hash");
        account.setRole("ADMIN");
        account.setEnabled(false);
        account.setCreatedAt(createdAt);

        assertThat(account.getId()).isEqualTo(7L);
        assertThat(account.getUsername()).isEqualTo("admin");
        assertThat(account.getPasswordHash()).isEqualTo("bcrypt-hash");
        assertThat(account.getRole()).isEqualTo("ADMIN");
        assertThat(account.isEnabled()).isFalse();
        assertThat(account.getCreatedAt()).isEqualTo(createdAt);
    }
}
