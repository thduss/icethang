package com.ssafy.icethang.domain.student.dto.response;

import com.ssafy.icethang.domain.student.entity.Student;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class StudentDetailResponse {
    private Long studentId;
    private String name;
    private Integer studentNumber;
    private String deviceUuid;
    private int currentXp;
    private int currentLevel;

    public static StudentDetailResponse from(Student student){
        return StudentDetailResponse.builder()
                .studentId(student.getId())
                .name(student.getName())
                .studentNumber(student.getStudentNumber())
                .deviceUuid(student.getDeviceUuid())
                .currentXp(student.getCurrentXp())
                .currentLevel(student.getCurrentLevel())
                .build();
    }
}
