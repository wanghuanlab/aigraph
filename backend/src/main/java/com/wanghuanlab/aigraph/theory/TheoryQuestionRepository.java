package com.wanghuanlab.aigraph.theory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TheoryQuestionRepository extends JpaRepository<TheoryQuestion, String> {
    List<TheoryQuestion> findAllByOrderBySortOrderAsc();
}
