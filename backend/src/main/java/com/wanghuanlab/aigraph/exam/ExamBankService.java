package com.wanghuanlab.aigraph.exam;

import com.wanghuanlab.aigraph.web.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class ExamBankService {
    private final ExamBankRepository banks;
    private final ExamQuestionRepository questions;
    private final ObjectMapper mapper;

    public ExamBankService(ExamBankRepository banks, ExamQuestionRepository questions, ObjectMapper mapper) {
        this.banks = banks;
        this.questions = questions;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> bank() {
        ExamBank meta = banks.findById((byte) 1).orElse(null);
        var rows = questions.findAllByOrderBySortOrderAscIdAsc();
        if (meta == null || rows.isEmpty()) throw new ApiException(503, "题库还没有导入数据库。");
        ArrayNode list = mapper.createArrayNode();
        for (ExamQuestion row : rows) {
            if (row.body != null) list.add(row.body);
        }
        ObjectNode bank = mapper.createObjectNode();
        bank.put("bankVersion", meta.version);
        bank.set("groups", meta.groupsJson == null ? mapper.createArrayNode() : meta.groupsJson);
        bank.set("questions", list);
        return Map.of("bank", bank);
    }
}
