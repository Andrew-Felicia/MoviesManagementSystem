package com.vincent.MovieLibrary.integration;

import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationIntegrationIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    @Qualifier("administratorInitializer")
    private CommandLineRunner administratorInitializer;

    @Test
    void startupCreatesAdministratorWithBcryptPassword() {
        UserAccount administrator = userAccountRepository.findByUsernameIgnoreCase("ADMIN").orElseThrow();

        assertThat(administrator.getUsername()).isEqualTo("admin");
        assertThat(administrator.getPasswordHash()).isNotEqualTo("admin");
        assertThat(passwordEncoder.matches("admin", administrator.getPasswordHash())).isTrue();
        assertThat(administrator.getRole()).isEqualTo("ADMIN");
        assertThat(administrator.isEnabled()).isTrue();
        assertThat(administrator.getCreatedAt()).isNotNull();
    }

    @Test
    void initializerDoesNotReplaceAnExistingAdministrator() throws Exception {
        UserAccount before = userAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow();
        String originalHash = before.getPasswordHash();
        long originalCount = userAccountRepository.count();

        administratorInitializer.run();

        assertThat(userAccountRepository.count()).isEqualTo(originalCount);
        assertThat(userAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getPasswordHash())
                .isEqualTo(originalHash);
    }

    @Test
    void userDetailsComeFromDatabaseAndUnknownUsersAreRejected() {
        assertThat(userDetailsService.loadUserByUsername("ADMIN").getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_ADMIN");
        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("missing"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    void disabledDatabaseAccountCannotAuthenticate() {
        UserAccount disabled = new UserAccount();
        disabled.setUsername("disabled-user");
        disabled.setPasswordHash(passwordEncoder.encode("password"));
        disabled.setRole("USER");
        disabled.setEnabled(false);
        disabled.setCreatedAt(java.time.LocalDateTime.now());
        userAccountRepository.save(disabled);

        try {
            assertThat(userDetailsService.loadUserByUsername("disabled-user").isEnabled()).isFalse();
        } finally {
            userAccountRepository.delete(disabled);
        }
    }

    @Test
    void unauthenticatedMovieRequestsReturnJson401() throws Exception {
        mockMvc.perform(get("/api/movies"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication required"));
    }

    @Test
    void onlyAdministratorsCanReadUserStatistics() throws Exception {
        mockMvc.perform(get("/api/admin/stats").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userCount").isNumber());

        mockMvc.perform(get("/api/admin/stats").with(user("member").roles("USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Request could not be verified"));

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication required"));
    }

    @Test
    void onlyAdministratorsCanManageAccountsAndResetPasscodes() throws Exception {
        String username = "managed-account";
        userAccountRepository.findByUsernameIgnoreCase(username).ifPresent(userAccountRepository::delete);
        UserAccount account = new UserAccount();
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode("original-passcode"));
        account.setRole("USER");
        account.setEnabled(true);
        account.setCreatedAt(java.time.LocalDateTime.now());
        userAccountRepository.saveAndFlush(account);

        try {
            mockMvc.perform(get("/api/admin/users").with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.username == 'managed-account')].role").value("USER"))
                    .andExpect(jsonPath("$[?(@.username == 'managed-account')].movieCount").value(0))
                    .andExpect(jsonPath("$[?(@.username == 'managed-account')].passwordHash").doesNotExist());

            mockMvc.perform(put("/api/admin/users/managed-account/password")
                            .with(user("admin").roles("ADMIN"))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newPasscode\":\"admin-reset-passcode\"}"))
                    .andExpect(status().isNoContent());
            assertThat(passwordEncoder.matches(
                    "admin-reset-passcode",
                    userAccountRepository.findByUsernameIgnoreCase(username).orElseThrow().getPasswordHash()
            )).isTrue();

            mockMvc.perform(get("/api/admin/users").with(user("member").roles("USER")))
                    .andExpect(status().isForbidden());
            mockMvc.perform(put("/api/admin/users/managed-account/password")
                            .with(user("member").roles("USER"))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newPasscode\":\"blocked\"}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(put("/api/admin/users/managed-account/password")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"newPasscode\":\"missing-csrf\"}"))
                    .andExpect(status().isForbidden());
        } finally {
            userAccountRepository.findByUsernameIgnoreCase(username).ifPresent(userAccountRepository::delete);
        }
    }

    @Test
    void administratorCanLoginUseSessionAndLogout() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"));

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("username", "admin")
                        .param("password", "admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertThat(session).isNotNull();

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void incorrectPasswordIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("username", "admin")
                        .param("password", "wrong"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid username or password"));
    }

    @Test
    void visitorCanRegisterThenLoginAsARegularUser() throws Exception {
        String username = "registration-it-user";
        userAccountRepository.findByUsernameIgnoreCase(username).ifPresent(userAccountRepository::delete);

        try {
            mockMvc.perform(post("/api/auth/register")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"username":"Registration-IT-User","passcode":"x"}
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.username").value(username))
                    .andExpect(jsonPath("$.role").value("USER"));

            UserAccount account = userAccountRepository.findByUsernameIgnoreCase(username).orElseThrow();
            assertThat(account.getPasswordHash()).isNotEqualTo("x");
            assertThat(passwordEncoder.matches("x", account.getPasswordHash())).isTrue();
            assertThat(account.getRole()).isEqualTo("USER");

            mockMvc.perform(post("/api/auth/login")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                            .param("username", username)
                            .param("password", "x"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value(username))
                    .andExpect(jsonPath("$.role").value("USER"));
        } finally {
            userAccountRepository.findByUsernameIgnoreCase(username).ifPresent(userAccountRepository::delete);
        }
    }

    @Test
    void registrationRejectsDuplicateUsernameInvalidInputAndMissingCsrf() throws Exception {
        String duplicateRequest = """
                {"username":"ADMIN","passcode":"safe-passcode"}
                """;
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateRequest))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Username is already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"bad user!","passcode":"x"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors.username").exists());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"no-csrf-user","passcode":"safe-passcode"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Request could not be verified"));
    }

    @Test
    void csrfBlocksUnsafeAuthenticatedRequestsWithoutToken() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Request could not be verified"));
    }

    @Test
    void csrfAllowsUnsafeAuthenticatedRequestsWithToken() throws Exception {
        mockMvc.perform(post("/api/movies")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"));
    }

    @Test
    void authenticatedUserCanChangePasscodeAndInvalidChangesAreRejected() throws Exception {
        UserAccount administrator = userAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow();
        String originalHash = administrator.getPasswordHash();

        try {
            mockMvc.perform(put("/api/auth/password")
                            .with(user("admin").roles("ADMIN"))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"currentPasscode":"admin","newPasscode":"unique-local-passcode"}
                                    """))
                    .andExpect(status().isNoContent());
            String changedHash = userAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getPasswordHash();
            assertThat(passwordEncoder.matches("unique-local-passcode", changedHash)).isTrue();

            mockMvc.perform(put("/api/auth/password")
                            .with(user("admin").roles("ADMIN"))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"currentPasscode":"wrong","newPasscode":"another"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Current passcode is incorrect"));

            mockMvc.perform(put("/api/auth/password")
                            .with(user("admin").roles("ADMIN"))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"currentPasscode":"unique-local-passcode","newPasscode":"unique-local-passcode"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("New passcode must be different"));

            mockMvc.perform(put("/api/auth/password")
                            .with(user("admin").roles("ADMIN"))
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"currentPasscode":"","newPasscode":""}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.currentPasscode").exists())
                    .andExpect(jsonPath("$.fieldErrors.newPasscode").exists());
        } finally {
            administrator.setPasswordHash(originalHash);
            userAccountRepository.saveAndFlush(administrator);
        }
    }
}
