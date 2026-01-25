package com.ssafy.icethang.domain.classgroup.dto.response;

import com.ssafy.icethang.domain.student.entity.Student;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
// 반 조회
public class ClassStudentResponse {
    private Long studentId;
    private String studentName;
    private Integer studentNumber;
    private String deviceUuid;

    public static ClassStudentResponse from(Student student) {
        return ClassStudentResponse.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .studentNumber(student.getStudentNumber())
                .deviceUuid(student.getDeviceUuid())
                .build();
    }
}
