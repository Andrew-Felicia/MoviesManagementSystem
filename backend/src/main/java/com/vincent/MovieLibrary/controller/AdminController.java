package com.vincent.MovieLibrary.controller;

import com.vincent.MovieLibrary.dto.AdminPasswordResetRequest;
import com.vincent.MovieLibrary.dto.AdminStatsResponse;
import com.vincent.MovieLibrary.dto.AdminUserResponse;
import com.vincent.MovieLibrary.service.AdminUserService;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserAccountRepository userAccountRepository;
    private final AdminUserService adminUserService;

    public AdminController(
            UserAccountRepository userAccountRepository,
            AdminUserService adminUserService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.adminUserService = adminUserService;
    }

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return new AdminStatsResponse(userAccountRepository.count());
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users() {
        return adminUserService.getUsers();
    }

    @PutMapping("/users/{username}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(
            @PathVariable String username,
            @Valid @RequestBody AdminPasswordResetRequest request
    ) {
        adminUserService.resetPassword(username, request);
    }
}
