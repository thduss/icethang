package com.ssafy.icethang.domain.student.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
// student 수정
public class StudentUpdateRequest {
    private String name;
    private Integer studentNumber;
}
