package com.wanghuanlab.aigraph.account;

import com.wanghuanlab.aigraph.grading.LlmSetting;
import com.wanghuanlab.aigraph.grading.LlmSettingRepository;
import com.wanghuanlab.aigraph.web.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AccountService {
    private static final String SEED_ADMIN_PASSWORD = "admin";
    private static final long SESSION_MS = 14L * 24 * 60 * 60 * 1000;
    private static final long CAPTCHA_MS = 5 * 60 * 1000;
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9_\\u4e00-\\u9fff]{2,20}$");
    private static final Pattern EXAM_ID = Pattern.compile("^[0-9a-fA-F-]{36}$");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserAccountRepository users;
    private final AuthSessionRepository sessions;
    private final LearningQuizRepository quizzes;
    private final LearningExamRepository exams;
    private final LlmSettingRepository models;
    private final ObjectMapper mapper;
    private final Map<String, Captcha> captchas = new ConcurrentHashMap<>();
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public AccountService(UserAccountRepository users, AuthSessionRepository sessions, LearningQuizRepository quizzes,
                          LearningExamRepository exams, LlmSettingRepository models, ObjectMapper mapper) {
        this.users = users;
        this.sessions = sessions;
        this.quizzes = quizzes;
        this.exams = exams;
        this.models = models;
        this.mapper = mapper;
    }

    public Map<String, String> issueCaptcha() {
        byte[] bytes = new byte[4];
        RANDOM.nextBytes(bytes);
        StringBuilder code = new StringBuilder(4);
        for (byte value : bytes) code.append(ALPHABET.charAt((value & 0xff) % ALPHABET.length()));
        String id = hex(16);
        long expires = System.currentTimeMillis() + CAPTCHA_MS;
        captchas.entrySet().removeIf(entry -> entry.getValue().expires <= System.currentTimeMillis());
        captchas.put(id, new Captcha(sha256(code.toString().toLowerCase()), expires));
        return Map.of("id", id, "svg", captchaSvg(code.toString()));
    }

    @Transactional
    public Map<String, Object> register(String username, String password, String captchaId, String captcha) {
        consumeCaptcha(captchaId, captcha);
        String name = username == null ? "" : username.trim();
        String secret = password == null ? "" : password;
        if (!USERNAME.matcher(name).matches() || name.equalsIgnoreCase("admin")) {
            throw new ApiException(400, "用户名需为 2 到 20 位字母、数字、下划线或汉字，admin 为管理员保留。");
        }
        if (secret.length() < 5 || secret.length() > 64) throw new ApiException(400, "密码需为 5 到 64 位。");
        ensureAdmin();
        if (users.findByUsernameIgnoreCase(name).isPresent()) throw new ApiException(409, "这个用户名已经注册。");
        long now = System.currentTimeMillis();
        Passwords.Record record = Passwords.hash(secret);
        UserAccount user = new UserAccount();
        user.username = name;
        user.role = "user";
        user.salt = record.salt();
        user.passwordHash = record.hash();
        user.createdAt = now;
        user.lastLoginAt = now;
        user.mustChangePassword = 0;
        users.save(user);
        LearningQuiz quiz = new LearningQuiz();
        quiz.username = name;
        quiz.answers = mapper.createObjectNode();
        quiz.updatedAt = now;
        quizzes.save(quiz);
        return Map.of("token", openSession(user), "user", publicUser(user));
    }

    @Transactional
    public Map<String, Object> login(String username, String password, String captchaId, String captcha, String attemptKey) {
        consumeCaptcha(captchaId, captcha);
        String name = username == null ? "" : username.trim();
        String secret = password == null ? "" : password;
        Attempt attempt = checkAttempt(attemptKey + ":" + name.toLowerCase());
        ensureAdmin();
        UserAccount user = users.findByUsernameIgnoreCase(name).orElse(null);
        boolean matches = user != null && Passwords.matches(secret, user.salt, user.passwordHash);
        if (!matches) {
            Passwords.matches(secret, "00000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000");
            attempt.count += 1;
            throw new ApiException(401, "用户名或密码不正确。");
        }
        attempt.count = 0;
        user.lastLoginAt = System.currentTimeMillis();
        users.save(user);
        return Map.of("token", openSession(user), "user", publicUser(user));
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) sessions.deleteById(token);
    }

    @Transactional
    public Map<String, Object> currentUser(String token) {
        UserAccount user = sessionUser(token);
        return Map.of("user", user == null ? mapper.nullNode() : publicUser(user));
    }

    @Transactional
    public Map<String, Object> changePassword(String token, String currentPassword, String nextPassword) {
        String secret = nextPassword == null ? "" : nextPassword;
        if (secret.length() < 5 || secret.length() > 64) throw new ApiException(400, "新密码需为 5 到 64 位。");
        UserAccount user = requireUser(token);
        if (!Passwords.matches(currentPassword == null ? "" : currentPassword, user.salt, user.passwordHash)) {
            throw new ApiException(401, "当前密码不正确。");
        }
        Passwords.Record record = Passwords.hash(secret);
        user.salt = record.salt();
        user.passwordHash = record.hash();
        user.mustChangePassword = SEED_ADMIN_PASSWORD.equals(secret) ? 1 : 0;
        users.save(user);
        return Map.of("user", publicUser(user));
    }

    @Transactional
    public Map<String, Object> learning(String token) {
        UserAccount user = requireUser(token);
        return Map.of("record", recordOf(user.username));
    }

    @Transactional
    public Map<String, Object> saveQuiz(String token, JsonNode answers) {
        UserAccount user = requireUser(token);
        if (answers == null || !answers.isObject()) throw new ApiException(400, "自测记录格式不正确。");
        ObjectNode next = mapper.createObjectNode();
        answers.fields().forEachRemaining(entry -> {
            JsonNode value = entry.getValue();
            if (entry.getKey().matches("^q-\\d+$") && value.isIntegralNumber() && value.intValue() >= 0 && value.intValue() <= 9) {
                next.put(entry.getKey(), value.intValue());
            }
        });
        LearningQuiz quiz = quizzes.findById(user.username).orElseGet(LearningQuiz::new);
        quiz.username = user.username;
        quiz.answers = next;
        quiz.updatedAt = System.currentTimeMillis();
        quizzes.save(quiz);
        return Map.of("quiz", quizView(quiz));
    }

    @Transactional
    public Map<String, Object> saveExam(String token, JsonNode input) {
        UserAccount user = requireUser(token);
        ObjectNode cleaned = cleanExam(input);
        LearningExam stored = exams.findById(new LearningExamKey(user.username, cleaned.get("id").asText())).orElse(null);
        if (stored != null && stored.body != null && stored.body.has("assessment")) {
            cleaned.set("assessment", stored.body.get("assessment"));
        }
        LearningExam exam = stored == null ? new LearningExam() : stored;
        exam.id = new LearningExamKey(user.username, cleaned.get("id").asText());
        exam.body = cleaned;
        exams.save(exam);
        return Map.of("exam", cleaned);
    }

    public TheoryPaper submittedTheory(String token, String examId) {
        UserAccount user = requireUser(token);
        LearningExam exam = exams.findById(new LearningExamKey(user.username, examId)).orElse(null);
        if (exam == null || exam.body == null) throw new ApiException(404, "没有找到这份答卷。请先登录后再交卷。");
        String mode = exam.body.path("mode").asText("");
        if (!mode.equals("theory") && !mode.equals("theory-practice")) throw new ApiException(400, "这不是理论答卷。");
        if (!"submitted".equals(exam.body.path("status").asText())) throw new ApiException(400, "请先交卷后再评分。");
        return new TheoryPaper(user.username, exam.body);
    }

    public void requireTheoryPracticeQuestion(String token, String questionId) {
        UserAccount user = requireUser(token);
        for (LearningExam exam : exams.findForUser(user.username)) {
            if (exam.body == null || !"theory-practice".equals(exam.body.path("mode").asText())) continue;
            for (JsonNode id : exam.body.path("questionIds")) {
                if (questionId.equals(id.asText())) return;
            }
        }
        throw new ApiException(400, "这道题不在你的理论练习里。");
    }

    public record TheoryPaper(String username, JsonNode body) {}

    @Transactional
    public void deleteExam(String token, String id) {
        UserAccount user = requireUser(token);
        exams.deleteById(new LearningExamKey(user.username, id));
    }

    @Transactional
    public Map<String, Object> adminOverview(String token) {
        UserAccount admin = requireAdmin(token);
        List<Map<String, Object>> rows = new ArrayList<>();
        int quizAnswers = 0;
        int examCount = 0;
        for (UserAccount item : users.findAll()) {
            ObjectNode record = recordOf(item.username);
            int answered = record.get("quiz").get("answers").size();
            int count = record.get("exams").size();
            long updated = record.get("quiz").path("updatedAt").asLong(0);
            var fields = record.get("exams").fields();
            while (fields.hasNext()) updated = Math.max(updated, fields.next().getValue().path("updatedAt").asLong(0));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("username", item.username);
            row.put("role", item.role);
            row.put("createdAt", item.createdAt);
            row.put("lastLoginAt", item.lastLoginAt);
            row.put("quizAnswered", answered);
            row.put("examCount", count);
            row.put("learningUpdatedAt", updated == 0 ? null : updated);
            rows.add(row);
            quizAnswers += answered;
            examCount += count;
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userCount", rows.size());
        body.put("quizAnswers", quizAnswers);
        body.put("examCount", examCount);
        body.put("users", rows);
        if (admin == null) throw new ApiException(401, "请先登录。");
        return body;
    }

    @Transactional
    public Map<String, Object> modelSettings(String token) {
        requireAdmin(token);
        return Map.of("model", publicModel(models.findById((byte) 1).orElse(null)));
    }

    @Transactional
    public Map<String, Object> saveModel(String token, JsonNode input) {
        requireAdmin(token);
        LlmSetting previous = models.findById((byte) 1).orElse(null);
        String baseUrl = chatCompletionsUrl(text(input, "baseUrl"));
        String model = text(input, "model");
        if (!model.matches("[\\w./:@+-]{1,80}")) throw new ApiException(400, "模型名称不正确。");
        String typed = text(input, "apiKey");
        String apiKey = typed.isBlank() && previous != null ? previous.apiKey : typed;
        if (!apiKey.matches("\\S{8,256}")) throw new ApiException(400, "API Key 需要为 8 到 256 位，且不能包含空格。");
        LlmSetting setting = previous == null ? new LlmSetting() : previous;
        setting.id = 1;
        setting.baseUrl = baseUrl;
        setting.modelName = model;
        setting.apiKey = apiKey;
        models.save(setting);
        return Map.of("model", publicModel(setting));
    }

    @Transactional
    public GradeSnapshot gradeSnapshot(String token, String examId) {
        UserAccount user = requireUser(token);
        LlmSetting model = models.findById((byte) 1).orElse(null);
        if (model == null || model.apiKey == null || model.apiKey.isBlank()) throw new ApiException(400, "管理员还没有配置阅卷模型。");
        LearningExam exam = exams.findById(new LearningExamKey(user.username, examId)).orElse(null);
        if (exam == null || exam.body == null) throw new ApiException(404, "没有找到这份答卷。请先登录后再交卷。");
        if (!"submitted".equals(exam.body.path("status").asText())) throw new ApiException(400, "请先交卷后再阅卷。");
        return new GradeSnapshot(user.username, model, exam.body.deepCopy());
    }

    @Transactional
    public JsonNode saveAssessment(String username, String examId, JsonNode assessment) {
        LearningExam exam = exams.findById(new LearningExamKey(username, examId)).orElse(null);
        if (exam == null || exam.body == null || !exam.body.isObject()) throw new ApiException(404, "没有找到这份答卷。");
        ObjectNode body = (ObjectNode) exam.body.deepCopy();
        body.set("assessment", assessment);
        exam.body = body;
        exams.save(exam);
        return assessment;
    }

    public record GradeSnapshot(String username, LlmSetting model, JsonNode exam) {}

    private void ensureAdmin() {
        if (users.existsById("admin")) return;
        Passwords.Record record = Passwords.hash(SEED_ADMIN_PASSWORD);
        UserAccount admin = new UserAccount();
        admin.username = "admin";
        admin.role = "admin";
        admin.salt = record.salt();
        admin.passwordHash = record.hash();
        admin.createdAt = System.currentTimeMillis();
        admin.mustChangePassword = 1;
        users.save(admin);
    }

    private String openSession(UserAccount user) {
        sessions.deleteByUsername(user.username);
        AuthSession session = new AuthSession();
        session.id = hex(24);
        session.username = user.username;
        session.expiresAt = System.currentTimeMillis() + SESSION_MS;
        sessions.save(session);
        return session.id;
    }

    private UserAccount sessionUser(String token) {
        if (token == null || token.isBlank()) return null;
        sessions.deleteByExpiresAtLessThanEqual(System.currentTimeMillis());
        AuthSession session = sessions.findById(token).orElse(null);
        if (session == null || session.expiresAt <= System.currentTimeMillis()) return null;
        return users.findById(session.username).orElse(null);
    }

    private UserAccount requireUser(String token) {
        UserAccount user = sessionUser(token);
        if (user == null) throw new ApiException(401, "请先登录。");
        return user;
    }

    private UserAccount requireAdmin(String token) {
        UserAccount user = requireUser(token);
        if (!"admin".equals(user.role)) throw new ApiException(403, "只有管理员可以查看后台。");
        return user;
    }

    private ObjectNode recordOf(String username) {
        ObjectNode record = mapper.createObjectNode();
        record.set("quiz", quizView(quizzes.findById(username).orElse(null)));
        ObjectNode examMap = mapper.createObjectNode();
        for (LearningExam exam : exams.findForUser(username)) {
            if (exam.body == null || !exam.body.isObject()) continue;
            ObjectNode body = (ObjectNode) exam.body.deepCopy();
            body.put("id", exam.id.examId);
            examMap.set(exam.id.examId, body);
        }
        record.set("exams", examMap);
        return record;
    }

    private ObjectNode quizView(LearningQuiz quiz) {
        ObjectNode node = mapper.createObjectNode();
        if (quiz == null || quiz.answers == null) node.set("answers", mapper.createObjectNode());
        else node.set("answers", quiz.answers);
        if (quiz == null || quiz.updatedAt == null) node.putNull("updatedAt");
        else node.put("updatedAt", quiz.updatedAt);
        return node;
    }

    private ObjectNode cleanExam(JsonNode input) {
        if (input == null || !input.isObject()) throw new ApiException(400, "答卷记录格式不正确。");
        String id = input.path("id").asText("");
        if (!EXAM_ID.matcher(id).matches()) throw new ApiException(400, "答卷编号不正确。");
        String mode = input.path("mode").asText("");
        boolean theory = mode.equals("theory") || mode.equals("theory-practice");
        if (!mode.equals("practice") && !mode.equals("exam") && !theory) throw new ApiException(400, "答卷类型不正确。");
        String status = input.path("status").asText("");
        if (!status.equals("active") && !status.equals("submitted")) throw new ApiException(400, "答卷状态不正确。");
        JsonNode ids = input.get("questionIds");
        int limit = theory ? 1000 : 40;
        if (ids == null || !ids.isArray() || ids.size() > limit) throw new ApiException(400, "题目列表不正确。");
        ObjectNode answers = mapper.createObjectNode();
        JsonNode source = input.get("answers");
        if (source != null && source.isObject()) {
            source.fields().forEachRemaining(question -> {
                if (question.getKey().length() > 20 || !question.getValue().isObject()) return;
                ObjectNode kept = mapper.createObjectNode();
                question.getValue().fields().forEachRemaining(field -> {
                    String text = field.getValue().path("text").asText("");
                    if (!text.isEmpty()) {
                        ObjectNode value = mapper.createObjectNode();
                        value.put("text", text.substring(0, Math.min(text.length(), 20000)));
                        kept.set(field.getKey().substring(0, Math.min(field.getKey().length(), 80)), value);
                    }
                });
                if (!kept.isEmpty()) answers.set(question.getKey(), kept);
            });
        }
        for (JsonNode questionId : ids) {
            if (!questionId.isTextual() || questionId.asText().length() > 20) throw new ApiException(400, "题目列表不正确。");
        }
        long now = System.currentTimeMillis();
        ObjectNode out = mapper.createObjectNode();
        out.put("id", id);
        out.put("mode", mode);
        out.put("status", status);
        out.put("startedAt", input.path("startedAt").asLong(now));
        out.put("updatedAt", input.path("updatedAt").asLong(now));
        if (input.hasNonNull("submittedAt")) out.put("submittedAt", input.get("submittedAt").asLong());
        String reason = input.path("submissionReason").asText("");
        if (reason.equals("timeout") || reason.equals("manual")) out.put("submissionReason", reason);
        out.set("questionIds", ids);
        out.set("answers", answers);
        JsonNode marks = input.get("markedQuestionIds");
        if (marks != null && marks.isArray()) {
            ArrayNode kept = mapper.createArrayNode();
            for (JsonNode mark : marks) {
                if (mark.isTextual() && mark.asText().length() <= 20 && kept.size() < limit) kept.add(mark.asText());
            }
            out.set("markedQuestionIds", kept);
        }
        return out;
    }

    private Map<String, Object> publicUser(UserAccount user) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("username", user.username);
        body.put("role", user.role);
        body.put("mustChangePassword", user.mustChangePassword != 0);
        return body;
    }

    private Map<String, Object> publicModel(LlmSetting model) {
        boolean configured = model != null && model.apiKey != null && !model.apiKey.isBlank()
                && model.baseUrl != null && !model.baseUrl.isBlank() && model.modelName != null && !model.modelName.isBlank();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("configured", configured);
        body.put("baseUrl", model == null || model.baseUrl == null ? "" : model.baseUrl);
        body.put("model", model == null || model.modelName == null ? "" : model.modelName);
        body.put("keyHint", configured ? model.apiKey.substring(model.apiKey.length() - 4) : "");
        return body;
    }

    private static String chatCompletionsUrl(String input) {
        String value = input == null ? "" : input.trim();
        if (value.length() > 300) throw new ApiException(400, "接口地址过长。");
        java.net.URI uri;
        try { uri = java.net.URI.create(value); }
        catch (IllegalArgumentException error) { throw new ApiException(400, "接口地址不正确。"); }
        String scheme = uri.getScheme();
        if (!"http".equals(scheme) && !"https".equals(scheme)) throw new ApiException(400, "接口地址只接受 http 或 https。");
        if (uri.getUserInfo() != null) throw new ApiException(400, "请把密钥填在 API Key，不要写进地址。");
        String path = uri.getPath() == null ? "" : uri.getPath().replaceAll("/+$", "");
        if (!path.endsWith("/chat/completions")) {
            if (path.endsWith("/v1")) path += "/chat/completions";
            else if (path.isEmpty()) path = "/v1/chat/completions";
            else path += "/chat/completions";
        }
        try {
            return new java.net.URI(scheme, null, uri.getHost(), uri.getPort(), path, null, null).toString();
        } catch (Exception error) {
            throw new ApiException(400, "接口地址不正确。");
        }
    }

    private static String text(JsonNode node, String field) {
        return node == null ? "" : node.path(field).asText("").trim();
    }

    private void consumeCaptcha(String id, String text) {
        Captcha entry = id == null ? null : captchas.remove(id);
        byte[] given = sha256(text == null ? "" : text.trim().toLowerCase());
        byte[] expected = entry != null && entry.expires > System.currentTimeMillis() ? entry.digest : sha256("missing-captcha");
        if (entry == null || entry.expires <= System.currentTimeMillis() || !MessageDigest.isEqual(given, expected)) {
            throw new ApiException(400, "验证码不正确或已过期。");
        }
    }

    private Attempt checkAttempt(String key) {
        long now = System.currentTimeMillis();
        Attempt entry = attempts.computeIfAbsent(key, ignored -> new Attempt());
        if (entry.resetAt <= now) {
            entry.count = 0;
            entry.resetAt = now + 10 * 60 * 1000;
        }
        if (entry.count >= 8) throw new ApiException(429, "尝试次数过多，请 10 分钟后再试。");
        return entry;
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    private static String hex(int bytes) {
        byte[] data = new byte[bytes];
        RANDOM.nextBytes(data);
        return HexFormat.of().formatHex(data);
    }

    private static String captchaSvg(String code) {
        StringBuilder chars = new StringBuilder();
        for (int index = 0; index < code.length(); index++) {
            int x = 18 + index * 26;
            int y = 28 + ((index * 7) % 5) - 2;
            int rotate = (index % 2 == 0 ? -1 : 1) * (8 + index * 3);
            chars.append("<text x=\"").append(x).append("\" y=\"").append(y)
                    .append("\" transform=\"rotate(").append(rotate).append(' ').append(x).append(' ').append(y)
                    .append(")\" font-size=\"24\" font-family=\"ui-monospace,monospace\" fill=\"#252838\">")
                    .append(code.charAt(index)).append("</text>");
        }
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"128\" height=\"44\" viewBox=\"0 0 128 44\"><rect width=\"128\" height=\"44\" fill=\"#f4f1ea\"/><path d=\"M4 30 C 30 8, 70 40, 124 12\" stroke=\"#8d86b8\" fill=\"none\"/><path d=\"M0 14 H128\" stroke=\"#d9d3c4\" fill=\"none\"/>" + chars + "</svg>";
    }

    private record Captcha(byte[] digest, long expires) {}

    private static final class Attempt {
        int count;
        long resetAt = System.currentTimeMillis() + 10 * 60 * 1000;
    }
}
