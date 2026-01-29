package com.ssafy.icethang.domain.monitoring.entity;
import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "class_event_logs")
public class ClassEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "log_id", nullable = false)
    private StudyLog studyLog;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private AlertType eventType;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ClassEventLog(Student student, StudyLog studyLog, AlertType eventType, LocalDateTime detectedAt) {
        this.student = student;
        this.studyLog = studyLog;
        this.eventType = eventType;
        this.detectedAt = (detectedAt != null) ? detectedAt : LocalDateTime.now();
    }
}
