package com.ssafy.icethang.domain.classgroup.entity;

import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE class_groups SET deleted_at = CURRENT_TIMESTAMP WHERE group_id = ?")
@Where(clause = "deleted_at IS NULL")
@Table(name = "class_groups")
public class ClassGroup extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Auth teacher;

    @Column(name = "grade", nullable = false)
    private Integer grade;

    @Column(name = "class_num", nullable = false)
    private Integer classNum;

    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    @Column(name = "allow_digital_mode")
    private Boolean allowDigitalMode;

    @Column(name = "allow_normal_mode")
    private Boolean allowNormalMode;

    @Column(name = "allow_theme_change")
    private Boolean allowThemeChange;

    @Builder
    public ClassGroup(Auth teacher, Integer grade, Integer classNum, String inviteCode,
                      boolean allowDigitalMode, boolean allowNormalMode, boolean allowThemeChange) {
        this.teacher = teacher;
        this.grade = grade;
        this.classNum = classNum;
        this.inviteCode = inviteCode;
        this.allowDigitalMode = allowDigitalMode;
        this.allowNormalMode = allowNormalMode;
        this.allowThemeChange = allowThemeChange;
    }

    public void updateClassInfo(Integer grade, Integer classNum) {
        this.grade = grade;
        this.classNum = classNum;
    }
}
