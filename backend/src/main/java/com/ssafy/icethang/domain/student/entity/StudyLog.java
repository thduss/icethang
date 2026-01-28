package com.ssafy.icethang.domain.student.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class) // 자동생성
@Table(name = "study_logs")
public class StudyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "timetable_id")
    private Long timetableId; // 선생님 부여 시에는 null 가능

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "class_no")
    private Integer classNo; // 몇 교시인지

    @Column(length = 50)
    private String subject; // 과목명

    // 컬럼 추가
    // erd 수정 필요
    @Column(length = 50)
    private String reason;

    @Column(name = "earned_xp")
    private int earnedXp;

    @Column(name = "focus_rate")
    private Integer focusRate;

    @Column(name = "distraction_score")
    private Integer distractionScore;

    @Column(name = "out_of_seat_count")
    private Integer outofseatCount;

    @Column(name = "bad_posture_time")
    private Integer badpostureTime;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // builder에 포함 안시키면 null
    @Builder
    public StudyLog(Student student, Long timetableId, Integer classNo, String subject,
                    String reason, int earnedXp) {
        this.student = student;
        this.timetableId = timetableId;
        this.classNo = classNo;
        this.subject = subject;
        this.reason = reason;
        this.earnedXp = earnedXp;
        this.date = LocalDate.now();
    }
}
