package com.ssafy.icethang.domain.student.repository;

import com.ssafy.icethang.domain.student.entity.StudyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {
    // 학습 로그 최신순으로 조회
    List<StudyLog> findAllByStudentIdOrderByCreatedAtDesc(Long studentId);
}
