package com.ssafy.icethang.domain.timetable.entity;

import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode(of = {"dayOfWeek", "classNo", "subject"}, callSuper = false)
@Table(name = "timetables")
public class Timetable {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long timetableId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private ClassGroup classGroup;

    private String dayOfWeek;
    private Integer classNo;
    private String subject;
    private Integer sem;

    @Builder
    public Timetable(ClassGroup classGroup, String dayOfWeek, Integer classNo, String subject, Integer sem) {
        this.classGroup = classGroup;
        this.dayOfWeek = dayOfWeek;
        this.classNo = classNo;
        this.subject = subject;
        this.sem = sem;
    }
}