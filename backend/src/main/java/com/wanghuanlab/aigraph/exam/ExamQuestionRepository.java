package com.wanghuanlab.aigraph.exam;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, String> {
    List<ExamQuestion> findAllByOrderBySortOrderAscIdAsc();
}
