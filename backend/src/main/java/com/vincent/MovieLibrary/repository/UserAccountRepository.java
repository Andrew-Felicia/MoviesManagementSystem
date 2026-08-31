package com.vincent.MovieLibrary.repository;

import com.vincent.MovieLibrary.dto.AdminUserResponse;
import com.vincent.MovieLibrary.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    @Query("""
            select new com.vincent.MovieLibrary.dto.AdminUserResponse(
                account.username,
                account.role,
                account.createdAt,
                count(movie.id)
            )
            from UserAccount account
            left join Movie movie on movie.owner = account
            group by account.id, account.username, account.role, account.createdAt
            order by account.username
            """)
    List<AdminUserResponse> findAllWithMovieCounts();
}
