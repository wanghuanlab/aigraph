package com.wanghuanlab.aigraph.web;

import com.wanghuanlab.aigraph.account.AccountService;
import com.wanghuanlab.aigraph.exam.ExamBankService;
import com.wanghuanlab.aigraph.grading.GradingService;
import com.wanghuanlab.aigraph.theory.TheoryBankService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class ApiController {
    private final AccountService accounts;
    private final ExamBankService banks;
    private final TheoryBankService theory;
    private final GradingService grading;

    public ApiController(AccountService accounts, ExamBankService banks, TheoryBankService theory, GradingService grading) {
        this.accounts = accounts;
        this.banks = banks;
        this.theory = theory;
        this.grading = grading;
    }

    @GetMapping("/api/exam/bank")
    public Map<String, Object> bank() {
        return banks.bank();
    }

    @GetMapping("/api/exam/theory")
    public Map<String, Object> theory() {
        return theory.bank();
    }

    @PostMapping("/api/exam/theory/check")
    public Map<String, Object> theoryCheck(@RequestBody JsonNode body, HttpServletRequest request) {
        String id = text(body, "id");
        accounts.requireTheoryPracticeQuestion(SessionCookies.read(request), id);
        List<String> selected = new ArrayList<>();
        JsonNode values = body == null ? null : body.get("selected");
        if (values != null && values.isArray()) values.forEach(item -> selected.add(item.asText("")));
        return theory.check(id, selected);
    }

    @PostMapping("/api/exam/theory/grade/{id}")
    public JsonNode theoryGrade(@PathVariable String id, HttpServletRequest request) {
        AccountService.TheoryPaper paper = accounts.submittedTheory(SessionCookies.read(request), id);
        return accounts.saveAssessment(paper.username(), id, theory.score(paper.body()));
    }

    @GetMapping("/api/auth/captcha")
    public Map<String, String> captcha() {
        return accounts.issueCaptcha();
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody JsonNode body, HttpServletRequest request, HttpServletResponse response) {
        Map<String, Object> result = accounts.register(text(body, "username"), text(body, "password"), text(body, "captchaId"), text(body, "captcha"));
        SessionCookies.write(response, (String) result.get("token"), SessionCookies.secure(request));
        return ResponseEntity.status(201).body(Map.of("user", result.get("user")));
    }

    @PostMapping("/api/auth/login")
    public Map<String, Object> login(@RequestBody JsonNode body, HttpServletRequest request, HttpServletResponse response) {
        String address = request.getRemoteAddr() == null ? "local" : request.getRemoteAddr();
        Map<String, Object> result = accounts.login(text(body, "username"), text(body, "password"), text(body, "captchaId"), text(body, "captcha"), address);
        SessionCookies.write(response, (String) result.get("token"), SessionCookies.secure(request));
        return Map.of("user", result.get("user"));
    }

    @PostMapping("/api/auth/logout")
    public Map<String, Object> logout(HttpServletRequest request, HttpServletResponse response) {
        accounts.logout(SessionCookies.read(request));
        SessionCookies.write(response, "", SessionCookies.secure(request));
        return Map.of("ok", true);
    }

    @GetMapping("/api/auth/me")
    public Map<String, Object> me(HttpServletRequest request) {
        return accounts.currentUser(SessionCookies.read(request));
    }

    @PostMapping("/api/auth/password")
    public Map<String, Object> password(@RequestBody JsonNode body, HttpServletRequest request) {
        return accounts.changePassword(SessionCookies.read(request), text(body, "currentPassword"), text(body, "nextPassword"));
    }

    @GetMapping("/api/learning")
    public Map<String, Object> learning(HttpServletRequest request) {
        return accounts.learning(SessionCookies.read(request));
    }

    @PutMapping("/api/learning/quiz")
    public Map<String, Object> quiz(@RequestBody JsonNode body, HttpServletRequest request) {
        return accounts.saveQuiz(SessionCookies.read(request), body.get("answers"));
    }

    @PutMapping("/api/learning/exams")
    public Map<String, Object> saveExam(@RequestBody JsonNode body, HttpServletRequest request) {
        return accounts.saveExam(SessionCookies.read(request), body);
    }

    @DeleteMapping("/api/learning/exams/{id}")
    public Map<String, Object> deleteExam(@PathVariable String id, HttpServletRequest request) {
        accounts.deleteExam(SessionCookies.read(request), id);
        return Map.of("ok", true);
    }

    @GetMapping("/api/admin/overview")
    public Map<String, Object> overview(HttpServletRequest request) {
        return accounts.adminOverview(SessionCookies.read(request));
    }

    @GetMapping("/api/admin/model")
    public Map<String, Object> model(HttpServletRequest request) {
        return accounts.modelSettings(SessionCookies.read(request));
    }

    @PutMapping("/api/admin/model")
    public Map<String, Object> saveModel(@RequestBody JsonNode body, HttpServletRequest request) {
        return accounts.saveModel(SessionCookies.read(request), body);
    }

    @PostMapping("/api/grading/exams/{id}")
    public JsonNode grade(@PathVariable String id, @RequestBody(required = false) JsonNode body, HttpServletRequest request) {
        return grading.grade(SessionCookies.read(request), id, body == null ? null : body.get("images"));
    }

    private static String text(JsonNode node, String field) {
        return node == null ? "" : node.path(field).asText("");
    }
}
