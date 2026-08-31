package com.vincent.MovieLibrary.service;

import com.vincent.MovieLibrary.dto.AdminPasswordResetRequest;
import com.vincent.MovieLibrary.dto.AdminUserResponse;
import com.vincent.MovieLibrary.entity.UserAccount;
import com.vincent.MovieLibrary.exception.InvalidPasscodeException;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AdminUserResponse> getUsers() {
        return userAccountRepository.findAllWithMovieCounts();
    }

    public void resetPassword(String username, AdminPasswordResetRequest request) {
        UserAccount account = userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("Account no longer exists"));

        if (passwordEncoder.matches(request.newPasscode(), account.getPasswordHash())) {
            throw new InvalidPasscodeException("New passcode must be different");
        }

        account.setPasswordHash(passwordEncoder.encode(request.newPasscode()));
        userAccountRepository.saveAndFlush(account);
    }
}
