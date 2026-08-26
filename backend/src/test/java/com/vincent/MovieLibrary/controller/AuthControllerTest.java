package com.vincent.MovieLibrary.controller;

import com.vincent.MovieLibrary.dto.AuthResponse;
import com.vincent.MovieLibrary.dto.PasswordChangeRequest;
import com.vincent.MovieLibrary.dto.RegistrationRequest;
import com.vincent.MovieLibrary.service.RegistrationService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.csrf.DefaultCsrfToken;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    private final RegistrationService registrationService = mock(RegistrationService.class);
    private final AuthController controller = new AuthController(registrationService);

    @Test
    void registerDelegatesToRegistrationService() {
        RegistrationRequest request = new RegistrationRequest("new-user", "safe-passcode");
        AuthResponse expected = new AuthResponse("new-user", "USER");
        when(registrationService.register(request)).thenReturn(expected);

        assertThat(controller.register(request)).isEqualTo(expected);
        verify(registrationService).register(request);
    }

    @Test
    void changePasswordDelegatesAuthenticatedUsernameToService() {
        PasswordChangeRequest request = new PasswordChangeRequest("old", "new");
        TestingAuthenticationToken authentication = new TestingAuthenticationToken("admin", "unused");

        controller.changePassword(authentication, request);

        verify(registrationService).changePassword("admin", request);
    }

    @Test
    void currentUserReturnsUsernameAndRole() {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(
                "admin", "unused", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThat(controller.currentUser(authentication))
                .isEqualTo(new AuthResponse("admin", "ADMIN"));
    }

    @Test
    void currentUserUsesSafeDefaultWhenNoRoleExists() {
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(
                "viewer", "unused", List.of());

        assertThat(controller.currentUser(authentication))
                .isEqualTo(new AuthResponse("viewer", "USER"));
    }

    @Test
    void csrfReturnsTokenAndHeaderName() {
        DefaultCsrfToken token = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "token-value");

        assertThat(controller.csrf(token))
                .isEqualTo(Map.of("token", "token-value", "headerName", "X-XSRF-TOKEN"));
    }
}
