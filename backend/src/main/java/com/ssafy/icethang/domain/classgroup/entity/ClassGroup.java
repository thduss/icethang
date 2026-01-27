package com.ssafy.icethang.domain.classgroup.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "class_groups")
public class ClassGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private Long id;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(name = "groups_name", nullable = false)
    private String groupName;

    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    @Column(name = "allow_digital_mode")
    private Boolean allowDigitalMode;

    @Column(name = "allow_normal_mode")
    private Boolean allowNormalMode;

    @Column(name = "allow_theme_change")
    private Boolean allowThemeChange;

    @Builder
    public ClassGroup(Long teacherId, String groupName, String inviteCode,
                      boolean allowDigitalMode, boolean allowNormalMode, boolean allowThemeChange) {
        this.teacherId = teacherId;
        this.groupName = groupName;
        this.inviteCode = inviteCode;
        this.allowDigitalMode = allowDigitalMode;
        this.allowNormalMode = allowNormalMode;
        this.allowThemeChange = allowThemeChange;
    }

    public void updateGroupName(String newGroupName) {
        this.groupName = newGroupName;
    }
}
