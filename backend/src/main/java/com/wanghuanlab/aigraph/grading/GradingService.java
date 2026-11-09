package com.wanghuanlab.aigraph.grading;

import com.wanghuanlab.aigraph.account.AccountService;
import com.wanghuanlab.aigraph.exam.ExamBankService;
import com.wanghuanlab.aigraph.web.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class GradingService {
    private static final Set<String> MEDIA = Set.of("image/jpeg", "image/png", "image/webp");
    private final AccountService accounts;
    private final ExamBankService banks;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build();

    public GradingService(AccountService accounts, ExamBankService banks, ObjectMapper mapper) {
        this.accounts = accounts;
        this.banks = banks;
        this.mapper = mapper;
    }

    public JsonNode grade(String token, String examId, JsonNode imagesNode) {
        List<Image> images = cleanImages(imagesNode);
        AccountService.GradeSnapshot snapshot = accounts.gradeSnapshot(token, examId);
        JsonNode bank = (JsonNode) banks.bank().get("bank");
        List<JsonNode> questions = new ArrayList<>();
        for (JsonNode id : snapshot.exam().path("questionIds")) {
            JsonNode found = null;
            for (JsonNode question : bank.path("questions")) {
                if (id.asText().equals(question.path("id").asText())) found = question;
            }
            if (found == null) throw new ApiException(400, "答卷里有题库中不存在的题目。");
            questions.add(found);
        }
        if (questions.isEmpty()) throw new ApiException(400, "答卷里有题库中不存在的题目。");
        ArrayNode items = mapper.createArrayNode();
        try {
            for (int index = 0; index < questions.size(); index += 6) {
                List<JsonNode> batch = questions.subList(index, Math.min(index + 6, questions.size()));
                items.addAll(scoreBatch(snapshot.model(), snapshot.exam(), batch, images));
            }
        } catch (ApiException error) {
            throw error;
        } catch (Exception error) {
            throw new ApiException(502, "暂时连接不上阅卷模型。");
        }
        int total = 0;
        int max = 0;
        for (JsonNode item : items) {
            total += item.path("suggestedPoints").asInt();
            max += item.path("maxPoints").asInt();
        }
        ObjectNode assessment = mapper.createObjectNode();
        assessment.put("status", "completed");
        assessment.put("provider", snapshot.model().modelName);
        assessment.put("assessedAt", System.currentTimeMillis());
        assessment.put("total", total);
        assessment.put("maxTotal", max);
        assessment.set("items", items);
        accounts.saveAssessment(snapshot.username(), examId, assessment);
        return mapper.createObjectNode().set("assessment", assessment);
    }

    private ArrayNode scoreBatch(LlmSetting model, JsonNode exam, List<JsonNode> batch, List<Image> images) throws Exception {
        List<Image> pictures = images.stream().filter(image -> batch.stream().anyMatch(question -> question.path("id").asText().equals(image.questionId))).toList();
        String prompt = promptFor(batch, exam, pictures);
        ObjectNode body = mapper.createObjectNode();
        body.put("model", model.modelName);
        body.put("temperature", 0.2);
        ArrayNode messages = body.putArray("messages");
        messages.addObject().put("role", "system").put("content", "你是人工智能训练师三级操作技能阅卷员，只返回要求的 JSON。");
        ObjectNode user = messages.addObject().put("role", "user");
        if (pictures.isEmpty()) user.put("content", prompt);
        else {
            ArrayNode content = user.putArray("content");
            content.addObject().put("type", "text").put("text", prompt);
            for (Image image : pictures) {
                ObjectNode part = content.addObject();
                part.put("type", "image_url");
                part.putObject("image_url").put("url", "data:" + image.mediaType + ";base64," + image.dataBase64);
            }
        }
        HttpRequest request = HttpRequest.newBuilder(URI.create(model.baseUrl))
                .timeout(Duration.ofSeconds(90))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + model.apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();
        HttpResponse<String> response;
        try {
            response = http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (java.net.http.HttpTimeoutException error) {
            throw new ApiException(504, "阅卷超时，请稍后再试。");
        } catch (Exception error) {
            throw new ApiException(502, "暂时连接不上阅卷模型。");
        }
        if (response.statusCode() / 100 != 2) {
            throw new ApiException(502, ("阅卷模型返回错误（" + response.statusCode() + "）。" + clip(response.body(), model.apiKey)).trim());
        }
        JsonNode payload;
        try { payload = mapper.readTree(response.body()); }
        catch (Exception error) { throw new ApiException(502, "阅卷模型没有返回 JSON。"); }
        String text = messageText(payload);
        if (text.isBlank()) throw new ApiException(502, "阅卷模型没有给出评分内容。");
        return parseItems(text, batch);
    }

    private ArrayNode parseItems(String text, List<JsonNode> questions) throws Exception {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) throw new ApiException(502, "阅卷模型没有返回可识别的分数。");
        JsonNode data;
        try { data = mapper.readTree(text.substring(start, end + 1)); }
        catch (Exception error) { throw new ApiException(502, "阅卷模型返回的分数无法解析。"); }
        ArrayNode items = mapper.createArrayNode();
        for (JsonNode question : questions) {
            JsonNode found = null;
            for (JsonNode row : data.path("items")) {
                if (question.path("id").asText().equals(row.path("questionId").asText())) found = row;
            }
            if (found == null || !found.path("suggestedPoints").isNumber()) {
                throw new ApiException(502, "阅卷模型没有给出 " + question.path("id").asText() + " 的分数。");
            }
            int points = question.path("points").asInt();
            int raw = (int) Math.round(found.path("suggestedPoints").asDouble());
            ObjectNode item = mapper.createObjectNode();
            item.put("questionId", question.path("id").asText());
            item.put("criterionId", "overall");
            item.put("maxPoints", points);
            item.put("suggestedPoints", Math.max(0, Math.min(points, raw)));
            item.put("reason", found.path("reason").asText("").replaceAll("\\s+", " "));
            if (item.get("reason").asText().length() > 300) item.put("reason", item.get("reason").asText().substring(0, 300));
            items.add(item);
        }
        return items;
    }

    private String promptFor(List<JsonNode> questions, JsonNode exam, List<Image> images) {
        StringBuilder body = new StringBuilder();
        for (JsonNode question : questions) {
            if (!body.isEmpty()) body.append("\n\n");
            body.append("### ").append(question.path("id").asText()).append(' ').append(question.path("title").asText())
                    .append("（满分 ").append(question.path("points").asInt()).append("）\n")
                    .append(stem(question)).append("\n考生作答：\n").append(answerText(question, exam, images));
        }
        return "请评阅下列操作技能题。只根据给出的题面、文字作答和图片给分，不要假设考生完成了没有展示的文件。\n每题 suggestedPoints 必须是 0 到该题满分之间的整数。reason 用中文，不超过 120 字。\n只返回 JSON：{\"items\":[{\"questionId\":\"题号\",\"suggestedPoints\":0,\"reason\":\"\"}]}\n\n" + body;
    }

    private String answerText(JsonNode question, JsonNode exam, List<Image> images) {
        StringBuilder lines = new StringBuilder();
        for (JsonNode section : question.path("answerSections")) {
            for (JsonNode field : section.path("fields")) {
                String text = exam.path("answers").path(question.path("id").asText()).path(field.path("id").asText()).path("text").asText("");
                List<Image> pictures = images.stream().filter(image -> image.questionId.equals(question.path("id").asText()) && image.fieldId.equals(field.path("id").asText())).toList();
                if (!lines.isEmpty()) lines.append('\n');
                if ("file".equals(field.path("kind").asText())) {
                    lines.append(section.path("title").asText()).append(" / ").append(field.path("label").asText()).append('：')
                            .append(pictures.isEmpty() ? "未附带可阅读的图片" : "附图片 " + String.join("、", pictures.stream().map(image -> image.name).toList()));
                } else {
                    lines.append(section.path("title").asText()).append(" / ").append(field.path("label").asText()).append('：').append(text.isBlank() ? "未填写" : text);
                }
            }
        }
        return lines.isEmpty() ? "未作答" : lines.toString();
    }

    private String stem(JsonNode question) {
        List<String> lines = new ArrayList<>();
        for (JsonNode block : question.path("content")) blockText(block, lines);
        String joined = String.join("\n", lines.stream().filter(line -> !line.isBlank()).toList());
        return joined.substring(0, Math.min(1800, joined.length()));
    }

    private void blockText(JsonNode block, List<String> lines) {
        if (block == null || block.path("hidden").asBoolean(false)) return;
        String type = block.path("type").asText();
        if (type.equals("heading") || type.equals("paragraph") || type.equals("note")) lines.add(block.path("text").asText(""));
        else if (type.equals("options")) {
            lines.add(block.path("stem").asText(""));
            block.path("choices").forEach(choice -> lines.add(choice.asText("")));
        } else if (type.equals("table")) {
            lines.add(join(block.path("columns")));
            for (JsonNode row : block.path("rows")) lines.add(join(row));
        } else if (type.equals("list")) {
            for (JsonNode item : block.path("items")) {
                if (!item.path("marker").asText("").isBlank()) lines.add(item.path("marker").asText());
                for (JsonNode child : item.path("blocks")) blockText(child, lines);
            }
        }
    }

    private static String join(JsonNode cells) {
        List<String> values = new ArrayList<>();
        cells.forEach(cell -> values.add(cell.asText("")));
        return String.join(" | ", values);
    }

    private static String messageText(JsonNode payload) {
        JsonNode content = payload.path("choices").path(0).path("message").path("content");
        if (content.isTextual()) return content.asText();
        if (content.isArray()) {
            StringBuilder text = new StringBuilder();
            content.forEach(part -> text.append(part.path("text").asText("")));
            return text.toString();
        }
        return "";
    }

    private static String clip(String text, String apiKey) {
        String cleaned = text == null ? "" : text.replace(apiKey, "").replaceAll("\\s+", " ");
        return cleaned.substring(0, Math.min(160, cleaned.length()));
    }

    private List<Image> cleanImages(JsonNode images) {
        if (images == null || images.isNull()) return List.of();
        if (!images.isArray() || images.size() > 6) throw new ApiException(400, "每次阅卷最多附带 6 张图片。");
        List<Image> cleaned = new ArrayList<>();
        for (JsonNode image : images) {
            if (!image.isObject()) throw new ApiException(400, "图片格式不正确。");
            String questionId = image.path("questionId").asText("");
            if (questionId.isBlank() || questionId.length() > 20) throw new ApiException(400, "图片对应的题号不正确。");
            String media = image.path("mediaType").asText("");
            if (!MEDIA.contains(media)) throw new ApiException(400, "阅卷图片只接受 JPG、PNG 或 WebP。");
            String data = image.path("dataBase64").asText("").replaceAll("\\s", "");
            if (!data.matches("[A-Za-z0-9+/]+=*") || data.length() > 1_700_000) throw new ApiException(400, "单张图片过大或内容不是有效的图片数据。");
            String fieldId = image.path("fieldId").asText("");
            String name = image.path("name").asText("image");
            cleaned.add(new Image(questionId, fieldId.substring(0, Math.min(80, fieldId.length())), name.substring(0, Math.min(80, name.length())), media, data));
        }
        return cleaned;
    }

    private record Image(String questionId, String fieldId, String name, String mediaType, String dataBase64) {}
}
