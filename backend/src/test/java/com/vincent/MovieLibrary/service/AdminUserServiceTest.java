package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.AdminPasswordResetRequest;
import com.vincent.MovieLibrary.dto.AdminUserResponse;
import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.exception.InvalidPasscodeException;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminUserService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserService(userAccountRepository, passwordEncoder);
    }

    @Test
    void getUsersReturnsOnlySafeAccountSummaries() {
        List<AdminUserResponse> users = List.of(
                new AdminUserResponse("admin", "ADMIN", LocalDateTime.now(), 500)
        );
        when(userAccountRepository.findAllWithMovieCounts()).thenReturn(users);

        assertThat(service.getUsers()).isEqualTo(users);
    }

    @Test
    void resetPasswordReplacesTheHashWithoutReadingTheOldPasscode() {
        UserAccount account = new UserAccount();
        account.setPasswordHash("old-hash");
        when(userAccountRepository.findByUsernameIgnoreCase("member")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("new-passcode", "old-hash")).thenReturn(false);
        when(passwordEncoder.encode("new-passcode")).thenReturn("new-hash");

        service.resetPassword("member", new AdminPasswordResetRequest("new-passcode"));

        assertThat(account.getPasswordHash()).isEqualTo("new-hash");
        verify(userAccountRepository).saveAndFlush(account);
    }

    @Test
    void resetPasswordRejectsAnUnchangedOrMissingAccount() {
        UserAccount account = new UserAccount();
        account.setPasswordHash("old-hash");
        when(userAccountRepository.findByUsernameIgnoreCase("member")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("same-passcode", "old-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.resetPassword("member", new AdminPasswordResetRequest("same-passcode")))
                .isInstanceOf(InvalidPasscodeException.class)
                .hasMessage("New passcode must be different");
        verify(userAccountRepository, never()).saveAndFlush(account);

        when(userAccountRepository.findByUsernameIgnoreCase("missing")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.resetPassword("missing", new AdminPasswordResetRequest("new-passcode")))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("Account no longer exists");
    }
}
