package com.ssafy.icethang.domain.student.entity;

import com.ssafy.icethang.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE study_logs SET deleted_at = CURRENT_TIMESTAMP WHERE log_id = ?")
@Where(clause = "deleted_at IS NULL")
@Table(name = "study_logs")
public class StudyLog extends BaseEntity {

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

    @Column(length = 50)
    private String reason;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "focus_rate")
    private Integer focusRate;

    @Column(name = "out_of_seat_count")
    private Integer outofseatCount;

    // builder에 포함 안시키면 null
    @Builder
    public StudyLog(Student student, Long timetableId, LocalDate date, Integer classNo,
                    String subject, String reason, Integer focusRate, Integer outofseatCount, LocalTime startTime, LocalTime endTime) {
        this.student = student;
        this.timetableId = timetableId;
        this.date = (date != null) ? date : LocalDate.now();
        this.classNo = classNo;
        this.subject = subject;
        this.reason = reason;
        this.focusRate = focusRate;
        this.outofseatCount = outofseatCount;
        this.startTime = startTime;
        this.endTime  = endTime;
    }
}
