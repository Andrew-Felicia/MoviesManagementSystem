package com.vincent.MovieLibrary.config;

import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.dto.AuthResponse;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import com.vincent.MovieLibrary.repository.MovieRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new LengthSafePasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserAccountRepository repository) {
        return username -> repository.findByUsernameIgnoreCase(username)
                .map(account -> User.withUsername(account.getUsername())
                        .password(account.getPasswordHash())
                        .roles(account.getRole())
                        .disabled(!account.isEnabled())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));
    }

    @Bean
    public CommandLineRunner administratorInitializer(
            UserAccountRepository repository,
            MovieRepository movieRepository,
            PasswordEncoder encoder,
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.password}") String password
    ) {
        return arguments -> {
            UserAccount administrator = repository.findByUsernameIgnoreCase(username).orElse(null);
            if (administrator == null) {
                administrator = new UserAccount();
                administrator.setUsername(username);
                administrator.setPasswordHash(encoder.encode(password));
                administrator.setRole("ADMIN");
                administrator.setEnabled(true);
                administrator.setCreatedAt(java.time.LocalDateTime.now());
                administrator = repository.save(administrator);
            }
            movieRepository.assignUnownedMoviesTo(administrator);
            movieRepository.enforceOwnerRequired();
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper) throws Exception {
        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(csrfHandler))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/", "/index.html", "/assets/**", "/favicon.ico",
                                "/api/auth/login", "/api/auth/register", "/api/auth/csrf"
                        ).permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .successHandler((request, response, authentication) -> {
                            String role = authentication.getAuthorities().stream()
                                    .findFirst()
                                    .map(authority -> authority.getAuthority().replaceFirst("^ROLE_", ""))
                                    .orElse("USER");
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), new AuthResponse(authentication.getName(), role));
                        })
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of("error", "Invalid username or password"));
                        }))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .deleteCookies("JSESSIONID", "XSRF-TOKEN")
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(HttpServletResponse.SC_NO_CONTENT)))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of("error", "Authentication required"));
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of("error", "Request could not be verified"));
                        }));

        return http.build();
    }
}
