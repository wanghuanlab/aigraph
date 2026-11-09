package com.wanghuanlab.aigraph.account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserAccount {
    @Id
    @Column(length = 20)
    public String username;

    @Column(nullable = false, length = 10)
    public String role;

    @Column(nullable = false, length = 32, columnDefinition = "char(32)")
    public String salt;

    @Column(name = "password_hash", nullable = false, length = 64, columnDefinition = "char(64)")
    public String passwordHash;

    @Column(name = "created_at", nullable = false)
    public long createdAt;

    @Column(name = "last_login_at")
    public Long lastLoginAt;

    @Column(name = "must_change_password", nullable = false)
    public int mustChangePassword;
}
