package com.wanghuanlab.aigraph.account;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class LearningExamKey implements Serializable {
    @Column(name = "username", length = 20)
    public String username;

    @Column(name = "id", length = 36, columnDefinition = "char(36)")
    public String examId;

    public LearningExamKey() {}

    public LearningExamKey(String username, String examId) {
        this.username = username;
        this.examId = examId;
    }

    @Override
    public boolean equals(Object other) {
        if (!(other instanceof LearningExamKey key)) return false;
        return Objects.equals(username, key.username) && Objects.equals(examId, key.examId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(username, examId);
    }
}
