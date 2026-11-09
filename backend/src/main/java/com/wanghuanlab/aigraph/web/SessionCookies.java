package com.wanghuanlab.aigraph.web;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public final class SessionCookies {
    public static final String NAME = "aigraph_session";
    private static final Duration LIFE = Duration.ofDays(14);

    private SessionCookies() {}

    public static String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return "";
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName()) && cookie.getValue() != null) return cookie.getValue();
        }
        return "";
    }

    public static void write(HttpServletResponse response, String token, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(NAME, token == null ? "" : token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(token == null || token.isEmpty() ? Duration.ZERO : LIFE)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static boolean secure(HttpServletRequest request) {
        return "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
    }
}
