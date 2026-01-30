package com.ssafy.icethang.domain.classgroup.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
public class ClassSessionEndRequest {
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String subject;      // 과목명 (예: 수학)
    private Integer classNo;
}
