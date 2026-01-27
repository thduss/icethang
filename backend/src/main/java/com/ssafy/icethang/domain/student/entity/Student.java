package com.ssafy.icethang.domain.student.entity;

import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private ClassGroup classGroup;

    @Column(nullable = false)
    private String name;

    @Column(name = "device_uuid", unique = true, nullable = false)
    private String deviceUuid; // 기기 고유ID

    @Column(name = "student_number")
    private Integer studentNumber; // 학생 번호

    @Column(name = "current_xp")
    private int currentXp;

    @Column(name = "current_level")
    private int currentLevel;

    @Builder
    public Student(String name, String deviceUuid, ClassGroup classGroup, Integer studentNumber) {
        this.name = name;
        this.deviceUuid = deviceUuid;
        this.classGroup = classGroup;
        this.studentNumber = studentNumber;
        this.currentXp = 0;
        this.currentLevel = 1;
    }

    // 학생 수정
    public void updateInfo(String name, Integer studentNumber) {
        if (name != null && !name.isBlank()) this.name = name;
        if (studentNumber != null) this.studentNumber = studentNumber;
    }

    // 선생님이 경험치 수정
    public void updateXp(int amount) {
        this.currentXp += amount;
    }

    // 레벨 업데이트 메서드
    public void updateLevel(int newLevel) {
        if (newLevel > 0) {
            this.currentLevel = newLevel;
        }
    }
}
