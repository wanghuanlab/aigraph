package com.wanghuanlab.aigraph.account;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    void deleteByUsername(String username);

    void deleteByExpiresAtLessThanEqual(long now);
}
