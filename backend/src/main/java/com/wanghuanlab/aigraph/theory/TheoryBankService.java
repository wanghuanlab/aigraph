package com.wanghuanlab.aigraph.theory;

import com.wanghuanlab.aigraph.web.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class TheoryBankService implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(TheoryBankService.class);
    private static final String BANK_VERSION = "2026-11-09-theory-review";

    private final TheoryQuestionRepository questions;
    private final EntityManager entityManager;
    private final ObjectMapper mapper;

    public TheoryBankService(TheoryQuestionRepository questions, EntityManager entityManager, ObjectMapper mapper) {
        this.questions = questions;
        this.entityManager = entityManager;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        ensureTable();
        if (questions.count() > 0) return;
        Path file = firstExisting(
                Path.of("database/seed/theory/questions.json"),
                Path.of("..", "database", "seed", "theory", "questions.json"));
        if (file == null) {
            log.warn("理论题库表是空的，也没有找到 database/seed/theory/questions.json。");
            return;
        }
        JsonNode bank = mapper.readTree(Files.readString(file));
        int order = 0;
        for (JsonNode item : bank.path("questions")) {
            TheoryQuestion row = new TheoryQuestion();
            row.id = item.path("id").asText();
            row.kind = item.path("kind").asText();
            row.sortOrder = order++;
            row.body = item;
            questions.save(row);
        }
        log.info("已从种子文件导入 {} 道理论题。", order);
    }

    public Map<String, Object> bank() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (TheoryQuestion row : questions.findAllByOrderBySortOrderAsc()) {
            if (row.body == null || !row.body.isObject()) continue;
            ObjectNode copy = ((ObjectNode) row.body).deepCopy();
            copy.remove("answer");
            copy.put("points", pointsOf(copy.path("kind").asText()));
            rows.add(mapper.convertValue(copy, Map.class));
        }
        Map<String, Object> rules = new LinkedHashMap<>();
        rules.put("durationMinutes", 90);
        rules.put("judge", Map.of("count", 40, "points", 0.5));
        rules.put("single", Map.of("count", 140, "points", 0.5));
        rules.put("multi", Map.of("count", 10, "points", 1));
        return Map.of("bank", Map.of("bankVersion", BANK_VERSION, "rules", rules, "questions", rows));
    }

    public Map<String, Object> check(String questionId, List<String> selected) {
        TheoryQuestion row = questions.findById(questionId).orElse(null);
        if (row == null || row.body == null) throw new ApiException(404, "没有这道理论题。");
        Set<String> expected = expected(row.body);
        boolean correct = expected.equals(normalize(selected));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("correct", correct);
        body.put("answer", new ArrayList<>(expected));
        body.put("points", pointsOf(row.kind));
        return body;
    }

    public JsonNode score(JsonNode exam) {
        Map<String, TheoryQuestion> byId = new LinkedHashMap<>();
        for (TheoryQuestion row : questions.findAllByOrderBySortOrderAsc()) byId.put(row.id, row);
        ArrayNode items = mapper.createArrayNode();
        double total = 0;
        double max = 0;
        for (JsonNode idNode : exam.path("questionIds")) {
            String id = idNode.asText();
            TheoryQuestion row = byId.get(id);
            if (row == null || row.body == null) continue;
            double points = pointsOf(row.kind);
            Set<String> expected = expected(row.body);
            Set<String> chosen = selected(exam, id);
            boolean correct = !expected.isEmpty() && expected.equals(chosen);
            double awarded = correct ? points : 0;
            total += awarded;
            max += points;
            ObjectNode item = mapper.createObjectNode();
            item.put("questionId", id);
            item.put("correct", correct);
            item.put("awarded", awarded);
            item.put("points", points);
            ArrayNode answer = item.putArray("answer");
            expected.forEach(answer::add);
            items.add(item);
        }
        ObjectNode assessment = mapper.createObjectNode();
        assessment.put("status", "scored");
        assessment.put("assessedAt", System.currentTimeMillis());
        assessment.put("total", total);
        assessment.put("maxTotal", max);
        assessment.set("items", items);
        return assessment;
    }

    private void ensureTable() {
        entityManager.createNativeQuery("""
                CREATE TABLE IF NOT EXISTS theory_questions (
                  id VARCHAR(20) PRIMARY KEY,
                  kind VARCHAR(16) NOT NULL,
                  sort_order INT NOT NULL,
                  body JSON NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """).executeUpdate();
    }

    private static double pointsOf(String kind) {
        return "multi".equals(kind) ? 1 : 0.5;
    }

    private static Set<String> expected(JsonNode body) {
        LinkedHashSet<String> values = new LinkedHashSet<>();
        for (JsonNode item : body.path("answer")) {
            if (!item.asText("").isBlank()) values.add(item.asText());
        }
        return values;
    }

    private static Set<String> selected(JsonNode exam, String questionId) {
        String text = exam.path("answers").path(questionId).path("choice").path("text").asText("");
        List<String> parts = new ArrayList<>();
        for (String part : text.split("[,，]")) parts.add(part);
        return normalize(parts);
    }

    private static Set<String> normalize(List<String> values) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        if (values == null) return set;
        for (String value : values) {
            if (value != null && !value.isBlank()) set.add(value.trim());
        }
        return set;
    }

    private static Path firstExisting(Path... candidates) {
        for (Path candidate : candidates) {
            if (Files.isRegularFile(candidate)) return candidate;
        }
        return null;
    }
}
