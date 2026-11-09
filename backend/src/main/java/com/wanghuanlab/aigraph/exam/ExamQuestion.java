package com.wanghuanlab.aigraph.exam;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "exam_questions")
public class ExamQuestion {
    @Id
    @Column(length = 20)
    public String id;

    @Column(name = "sort_order", nullable = false)
    public int sortOrder;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "json")
    public JsonNode body;
}
