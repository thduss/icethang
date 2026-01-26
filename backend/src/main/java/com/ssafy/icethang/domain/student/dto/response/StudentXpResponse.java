package com.ssafy.icethang.domain.student.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentXpResponse {
    private Long studentId;
    private Integer level;
    private Integer currentExp;
    private Integer requiredExpNextLevel;
}
