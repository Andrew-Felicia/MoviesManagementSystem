package com.vincent.MovieLibrary.config;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class LengthSafePasswordEncoder implements PasswordEncoder {

    private static final String PREFIX = "{sha256-bcrypt}";
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return PREFIX + bcrypt.encode(preHash(rawPassword));
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (encodedPassword != null && encodedPassword.startsWith(PREFIX)) {
            return bcrypt.matches(preHash(rawPassword), encodedPassword.substring(PREFIX.length()));
        }

        try {
            return bcrypt.matches(rawPassword, encodedPassword);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static String preHash(CharSequence rawPassword) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawPassword.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
