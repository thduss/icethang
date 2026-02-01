package com.ssafy.icethang.domain.monitoring.repository;

import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import com.ssafy.icethang.domain.monitoring.entity.ClassEventLog;
import com.ssafy.icethang.domain.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ClassEventLogRepository extends JpaRepository<ClassEventLog, Long> {
    @Query("SELECT COUNT(e) FROM ClassEventLog e " +
            "WHERE e.student = :student " +
            "AND e.eventType = :eventType " +
            "AND e.createdAt BETWEEN :start AND :end " +
            "AND e.studyLog IS NULL")
    long countCurrentSessionLogs(@Param("student") Student student,
                                         @Param("eventType") AlertType eventType,
                                         @Param("start") LocalDateTime start,
                                         @Param("end") LocalDateTime end);

    List<ClassEventLog> findAllByStudentInAndStudyLogIsNullOrderByDetectedAtAsc(List<Student> students);
}
