package com.ssafy.icethang.domain.student.repository;

import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {
    // 학습 로그 최신순으로 조회
    List<StudyLog> findAllByStudentIdOrderByCreatedAtDesc(Long studentId);

    // 특정 학생의 로그 개수 조회
    long countByStudentAndDateAndReasonContaining(Student student, LocalDate date, String reasonKeyword);

    // 특정 학생의 가장 최신 학습 로그 1개를 가져오기
    Optional<StudyLog> findTopByStudentOrderByCreatedAtDesc(Student student);

    // 학생 ID와 날짜로 조회 (교시 순서대로 정렬)
    List<StudyLog> findByStudent_IdAndDateOrderByClassNoAsc(Long studentId, LocalDate date);

    Optional<StudyLog> findTopByStudentAndDateOrderByCreatedAtDesc(Student student, LocalDate date);

    // 특정 학생의 특정 기간 내 모든 로그 조회
    List<StudyLog> findByStudent_IdAndDateBetweenOrderByDateAsc(Long studentId, LocalDate startDate, LocalDate endDate);
}
