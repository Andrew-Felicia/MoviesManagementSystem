package com.vincent.MovieLibrary.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class LengthSafePasswordEncoderTest {

    private final LengthSafePasswordEncoder encoder = new LengthSafePasswordEncoder();

    @Test
    void encodesAndMatchesPasscodesOfAnyLength() {
        String oneCharacterHash = encoder.encode("x");
        String veryLongPasscode = "long-passcode-".repeat(1_000);
        String veryLongHash = encoder.encode(veryLongPasscode);

        assertThat(oneCharacterHash).startsWith("{sha256-bcrypt}");
        assertThat(encoder.matches("x", oneCharacterHash)).isTrue();
        assertThat(encoder.matches("y", oneCharacterHash)).isFalse();
        assertThat(encoder.matches(veryLongPasscode, veryLongHash)).isTrue();
        assertThat(encoder.matches(veryLongPasscode + "wrong", veryLongHash)).isFalse();
    }

    @Test
    void existingPlainBcryptHashesRemainValid() {
        String legacyHash = new BCryptPasswordEncoder().encode("admin");

        assertThat(encoder.matches("admin", legacyHash)).isTrue();
        assertThat(encoder.matches("wrong", legacyHash)).isFalse();
        assertThat(encoder.matches("x".repeat(10_000), legacyHash)).isFalse();
        assertThat(encoder.matches("admin", null)).isFalse();
    }
}
