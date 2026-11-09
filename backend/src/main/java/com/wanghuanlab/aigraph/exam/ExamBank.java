package com.wanghuanlab.aigraph.exam;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "exam_bank")
public class ExamBank {
    @Id
    public byte id;

    @Column(nullable = false, length = 80)
    public String version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "groups_json", nullable = false, columnDefinition = "json")
    public JsonNode groupsJson;
}
