package com.ssafy.icethang.domain.student.repository;

import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {
    // 학습 로그 최신순으로 조회
    List<StudyLog> findAllByStudentIdOrderByCreatedAtDesc(Long studentId);

    // 특정 학생의 가장 최신 학습 로그 1개를 가져오기
    Optional<StudyLog> findTopByStudentOrderByCreatedAtDesc(Student student);
}
