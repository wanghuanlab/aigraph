package com.wanghuanlab.aigraph.exam;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;

/** Fills an empty question bank from database/seed. Existing rows are left untouched. */
@Component
public class SeedImporter implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(SeedImporter.class);
    private final ExamQuestionRepository questions;
    private final ExamBankRepository banks;
    private final ObjectMapper mapper;

    public SeedImporter(ExamQuestionRepository questions, ExamBankRepository banks, ObjectMapper mapper) {
        this.questions = questions;
        this.banks = banks;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (questions.count() > 0) return;
        Path file = firstExisting(
                Path.of("database/seed/practical/questions.json"),
                Path.of("..", "database/seed/practical/questions.json"));
        if (file == null) {
            log.warn("题库表是空的，也没有找到 database/seed/practical/questions.json。");
            return;
        }
        JsonNode bank = mapper.readTree(Files.readString(file));
        ExamBank meta = new ExamBank();
        meta.id = 1;
        meta.version = bank.path("bankVersion").asText();
        meta.groupsJson = bank.get("groups");
        banks.save(meta);
        int order = 0;
        for (JsonNode question : bank.path("questions")) {
            ExamQuestion row = new ExamQuestion();
            row.id = question.path("id").asText();
            row.sortOrder = order++;
            row.body = question;
            questions.save(row);
        }
        log.info("已从种子文件导入 {} 道实操题。", order);
    }

    private static Path firstExisting(Path... candidates) {
        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) return candidate;
        }
        return null;
    }
}
