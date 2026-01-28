package com.ssafy.icethang.domain.classgroup.dto.response;

import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ClassResponse {
    private Long classId;
    private Integer grade;
    private Integer classNum;
    private String inviteCode;
    private Long teacherId;

    public static ClassResponse from(ClassGroup classGroup) {
        return ClassResponse.builder()
                .classId(classGroup.getId())
                .grade(classGroup.getGrade())
                .classNum(classGroup.getClassNum())
                .inviteCode(classGroup.getInviteCode())
                .teacherId(classGroup.getTeacher().getId())
                .build();
    }
}
