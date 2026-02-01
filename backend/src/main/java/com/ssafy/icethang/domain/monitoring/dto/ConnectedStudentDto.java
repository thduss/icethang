package com.ssafy.icethang.domain.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectedStudentDto {
    private Long studentId;
    private String studentName;
    private Integer studentNumber;
}
