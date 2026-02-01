package com.ssafy.icethang.domain.student.entity;

import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import com.ssafy.icethang.domain.theme.entity.Theme;
import com.ssafy.icethang.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE student_id = ?")
@Where(clause = "deleted_at IS NULL")
@Table(name = "students")
public class Student extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Long id;

    @Column(name = "school_id")
    private Integer schoolId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private ClassGroup classGroup;

    @Column(name = "student_name", nullable = false)
    private String name;

    @Column(name = "device_uuid", unique = true, nullable = false)
    private String deviceUuid; // 기기 고유ID

    @Column(name = "student_number")
    private Integer studentNumber; // 학생 번호

    @Column(name = "current_xp")
    private int currentXp;

    @Column(name = "current_level")
    private int currentLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipped_character_id")
    private Theme equippedCharacter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipped_background_id")
    private Theme equippedBackground;

    @Builder
    public Student(String name, String deviceUuid, ClassGroup classGroup, Integer studentNumber,
                   Integer schoolId, Theme equippedCharacter, Theme equippedBackground) {
        this.name = name;
        this.deviceUuid = deviceUuid;
        this.classGroup = classGroup;
        this.studentNumber = studentNumber;
        this.schoolId = schoolId;
        this.currentXp = 0;
        this.currentLevel = 1;
        this.equippedCharacter = equippedCharacter;
        this.equippedBackground = equippedBackground;
    }

    // 학생 수정
    public void updateInfo(String name, Integer studentNumber) {
        if (name != null && !name.isBlank()) this.name = name;
        if (studentNumber != null) this.studentNumber = studentNumber;
    }

    // 선생님이 경험치 수정
    public void addXp(int amount) {
        this.currentXp += amount;
    }

    // 레벨 업데이트 메서드
    public void updateLevel(int newLevel) {
        if (newLevel > 0) {
            this.currentLevel = newLevel;
        }
    }

    // 캐릭터 장착
    public void equipCharacter(Theme character) {
        this.equippedCharacter = character;
    }

    // 테마(배경) 장착
    public void equipBackground(Theme background) {
        this.equippedBackground = background;
    }
}
