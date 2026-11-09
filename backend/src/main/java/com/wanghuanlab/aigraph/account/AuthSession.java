package com.wanghuanlab.aigraph.account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "auth_sessions")
public class AuthSession {
    @Id
    @Column(length = 64)
    public String id;

    @Column(nullable = false, length = 20)
    public String username;

    @Column(name = "expires_at", nullable = false)
    public long expiresAt;
}
