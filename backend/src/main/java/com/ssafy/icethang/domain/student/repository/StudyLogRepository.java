package com.ssafy.icethang.domain.student.repository;

import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {

    // 일별 조회
    List<StudyLog> findByStudent_ClassGroup_IdAndStudent_IdAndDateOrderByClassNoAsc(Long groupId, Long studentId, LocalDate date);

    List<StudyLog> findByStudent_ClassGroup_IdAndStudent_IdAndDateBetweenOrderByDateAsc(Long groupId, Long studentId, LocalDate start, LocalDate end);

    List<StudyLog> findByStudent_ClassGroup_IdAndStudent_Id(Long groupId, Long studentId);

    Optional<StudyLog> findTopByStudentOrderByCreatedAtDesc(Student student);
}