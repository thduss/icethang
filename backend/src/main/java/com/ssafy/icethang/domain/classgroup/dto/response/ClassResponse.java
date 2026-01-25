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
    private String groupName;
    private String inviteCode;
    private Long teacherId;

    public static ClassResponse from(ClassGroup classGroup) {
        return ClassResponse.builder()
                .classId(classGroup.getId())
                .groupName(classGroup.getGroupName())
                .inviteCode(classGroup.getInviteCode())
                .teacherId(classGroup.getTeacherId())
                .build();
    }
}
