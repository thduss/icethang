package com.ssafy.icethang.domain.student.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
// 로그인 후 학생에게 학생이름 반id, 학년, 반, 번호 응답
public class StudentLoginResponse {
    private Long studentId;
    private String studentName;
    private Long classId; // 반 id
    private Integer grade; // 학년
    private Integer classNum; // 반
    private Integer studentNumber; // 2번
    private String accessToken;
}
