package com.wanghuanlab.aigraph.account;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "learning_quiz")
public class LearningQuiz {
    @Id
    @Column(length = 20)
    public String username;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "json")
    public JsonNode answers;

    @Column(name = "updated_at")
    public Long updatedAt;
}
