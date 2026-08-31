package com.vincent.MovieLibrary.controller;

import com.vincent.MovieLibrary.dto.AdminUserResponse;
import com.vincent.MovieLibrary.repository.UserAccountRepository;
import com.vincent.MovieLibrary.service.AdminUserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserAccountRepository userAccountRepository;

    @MockitoBean
    private AdminUserService adminUserService;

    @Test
    void statsReturnsRegisteredUserCount() throws Exception {
        when(userAccountRepository.count()).thenReturn(37L);

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userCount").value(37));
    }

    @Test
    void usersReturnSafeAccountDetailsAndMovieCounts() throws Exception {
        when(adminUserService.getUsers()).thenReturn(List.of(
                new AdminUserResponse("admin", "ADMIN", LocalDateTime.of(2026, 8, 31, 10, 30), 500),
                new AdminUserResponse("sam", "USER", LocalDateTime.of(2026, 8, 31, 11, 45), 3)
        ));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].role").value("ADMIN"))
                .andExpect(jsonPath("$[0].movieCount").value(500))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[1].username").value("sam"));
    }

    @Test
    void resetPasswordDelegatesToTheAdminService() throws Exception {
        mockMvc.perform(put("/api/admin/users/member/password")
                        .contentType("application/json")
                        .content("{\"newPasscode\":\"replacement-passcode\"}"))
                .andExpect(status().isNoContent());
    }
}
