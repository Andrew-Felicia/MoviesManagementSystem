package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.AuthResponse;
import com.vincent.MovieLibrary.dto.PasswordChangeRequest;
import com.vincent.MovieLibrary.dto.RegistrationRequest;
import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.exception.UsernameAlreadyExistsException;
import com.vincent.MovieLibrary.exception.InvalidPasscodeException;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class RegistrationService {

    private final UserAccountRepository repository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(UserAccountRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegistrationRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (repository.findByUsernameIgnoreCase(username).isPresent()) {
            throw new UsernameAlreadyExistsException();
        }

        UserAccount account = new UserAccount();
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode(request.passcode()));
        account.setRole("USER");
        account.setEnabled(true);
        account.setCreatedAt(LocalDateTime.now());

        try {
            repository.saveAndFlush(account);
        } catch (DataIntegrityViolationException exception) {
            throw new UsernameAlreadyExistsException();
        }
        return new AuthResponse(account.getUsername(), account.getRole());
    }

    public void changePassword(String username, PasswordChangeRequest request) {
        UserAccount account = repository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("Account no longer exists"));

        if (!passwordEncoder.matches(request.currentPasscode(), account.getPasswordHash())) {
            throw new InvalidPasscodeException("Current passcode is incorrect");
        }
        if (passwordEncoder.matches(request.newPasscode(), account.getPasswordHash())) {
            throw new InvalidPasscodeException("New passcode must be different");
        }

        account.setPasswordHash(passwordEncoder.encode(request.newPasscode()));
        repository.saveAndFlush(account);
    }
}
