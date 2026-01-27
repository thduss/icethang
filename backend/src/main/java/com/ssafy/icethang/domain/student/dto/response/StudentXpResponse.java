package com.ssafy.icethang.domain.student.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@Builder
@NoArgsConstructor
public class StudentXpResponse {
    private int currentLevel;
    private int currentXp;
    private String reason;
}
