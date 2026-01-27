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
    private int exp;
    private int level;

    public static StudentDetailResponse from(Student student){
        return StudentDetailResponse.builder()
                .studentId(student.getId())
                .name(student.getName())
                .studentNumber(student.getStudentNumber())
                .deviceUuid(student.getDeviceUuid())
                .exp(student.getCurrentXp())
                .level(student.getCurrentLevel())
                .build();
    }
}
