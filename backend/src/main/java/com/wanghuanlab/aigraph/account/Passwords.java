package com.wanghuanlab.aigraph.account;

import org.bouncycastle.crypto.generators.SCrypt;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

/** Matches Node crypto.scryptSync(password, salt, 32) with N=16384, r=8, p=1. */
public final class Passwords {
    private static final int N = 16384;
    private static final int R = 8;
    private static final int P = 1;
    private static final int LENGTH = 32;
    private static final SecureRandom RANDOM = new SecureRandom();

    private Passwords() {}

    public record Record(String salt, String hash) {}

    public static Record hash(String password) {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        byte[] hash = SCrypt.generate(password.getBytes(java.nio.charset.StandardCharsets.UTF_8), salt, N, R, P, LENGTH);
        return new Record(HexFormat.of().formatHex(salt), HexFormat.of().formatHex(hash));
    }

    public static boolean matches(String password, String saltHex, String hashHex) {
        byte[] salt = HexFormat.of().parseHex(saltHex);
        byte[] expected = HexFormat.of().parseHex(hashHex);
        byte[] actual = SCrypt.generate(password.getBytes(java.nio.charset.StandardCharsets.UTF_8), salt, N, R, P, LENGTH);
        return MessageDigest.isEqual(actual, expected);
    }
}
