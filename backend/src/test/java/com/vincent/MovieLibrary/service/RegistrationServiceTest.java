package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.AuthResponse;
import com.vincent.MovieLibrary.dto.PasswordChangeRequest;
import com.vincent.MovieLibrary.dto.RegistrationRequest;
import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.exception.UsernameAlreadyExistsException;
import com.vincent.MovieLibrary.exception.InvalidPasscodeException;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private UserAccountRepository repository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private RegistrationService service;

    @BeforeEach
    void setUp() {
        service = new RegistrationService(repository, passwordEncoder);
    }

    @Test
    void registerNormalizesUsernameHashesPasscodeAndCreatesRegularUser() {
        when(repository.findByUsernameIgnoreCase("new.user")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("safe-passcode")).thenReturn("bcrypt-hash");

        AuthResponse response = service.register(new RegistrationRequest("  New.User  ", "safe-passcode"));

        ArgumentCaptor<UserAccount> captor = ArgumentCaptor.forClass(UserAccount.class);
        verify(repository).saveAndFlush(captor.capture());
        UserAccount saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("new.user");
        assertThat(saved.getPasswordHash()).isEqualTo("bcrypt-hash");
        assertThat(saved.getRole()).isEqualTo("USER");
        assertThat(saved.isEnabled()).isTrue();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(response).isEqualTo(new AuthResponse("new.user", "USER"));
    }

    @Test
    void registerRejectsAnExistingUsernameIgnoringCase() {
        when(repository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(new UserAccount()));

        assertThatThrownBy(() -> service.register(new RegistrationRequest("ADMIN", "safe-passcode")))
                .isInstanceOf(UsernameAlreadyExistsException.class)
                .hasMessage("Username is already registered");
        verify(passwordEncoder, never()).encode(any());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void registerConvertsAConcurrentUniqueConstraintFailureToConflict() {
        when(repository.findByUsernameIgnoreCase("racing-user")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("safe-passcode")).thenReturn("bcrypt-hash");
        when(repository.saveAndFlush(any(UserAccount.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThatThrownBy(() -> service.register(new RegistrationRequest("racing-user", "safe-passcode")))
                .isInstanceOf(UsernameAlreadyExistsException.class)
                .hasMessage("Username is already registered");
    }

    @Test
    void changePasswordVerifiesCurrentPasscodeAndSavesNewHash() {
        UserAccount account = new UserAccount();
        account.setPasswordHash("old-hash");
        when(repository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("current", "old-hash")).thenReturn(true);
        when(passwordEncoder.matches("new-unique", "old-hash")).thenReturn(false);
        when(passwordEncoder.encode("new-unique")).thenReturn("new-hash");

        service.changePassword("admin", new PasswordChangeRequest("current", "new-unique"));

        assertThat(account.getPasswordHash()).isEqualTo("new-hash");
        verify(repository).saveAndFlush(account);
    }

    @Test
    void changePasswordRejectsWrongCurrentAndReusedPasscodes() {
        UserAccount account = new UserAccount();
        account.setPasswordHash("old-hash");
        when(repository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword("admin", new PasswordChangeRequest("wrong", "new")))
                .isInstanceOf(InvalidPasscodeException.class)
                .hasMessage("Current passcode is incorrect");

        when(passwordEncoder.matches("current", "old-hash")).thenReturn(true);
        when(passwordEncoder.matches("same", "old-hash")).thenReturn(true);
        assertThatThrownBy(() -> service.changePassword("admin", new PasswordChangeRequest("current", "same")))
                .isInstanceOf(InvalidPasscodeException.class)
                .hasMessage("New passcode must be different");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void changePasswordRejectsADeletedAccount() {
        when(repository.findByUsernameIgnoreCase("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changePassword("missing", new PasswordChangeRequest("old", "new")))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("Account no longer exists");
    }
}
