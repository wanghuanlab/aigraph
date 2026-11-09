package com.wanghuanlab.aigraph.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LearningExamRepository extends JpaRepository<LearningExam, LearningExamKey> {
    @Query("select e from LearningExam e where e.id.username = :username")
    List<LearningExam> findForUser(@Param("username") String username);
}
