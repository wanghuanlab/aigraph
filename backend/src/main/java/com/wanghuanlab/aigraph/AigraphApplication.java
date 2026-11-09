package com.wanghuanlab.aigraph;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootApplication
public class AigraphApplication {
    public static void main(String[] args) {
        loadEnv(Path.of(".env"));
        loadEnv(Path.of("..", ".env"));
        SpringApplication.run(AigraphApplication.class, args);
    }

    private static void loadEnv(Path path) {
        if (!Files.isRegularFile(path)) return;
        try {
            for (String line : Files.readAllLines(path)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                int index = trimmed.indexOf('=');
                if (index < 1) continue;
                String key = trimmed.substring(0, index).trim();
                String current = System.getenv(key);
                if (current != null && !current.isBlank()) continue;
                if (System.getProperty(key) != null && !System.getProperty(key).isBlank()) continue;
                System.setProperty(key, trimmed.substring(index + 1).trim());
            }
        } catch (Exception ignored) {
            // A missing local file should not hide a later connection error.
        }
    }
}
