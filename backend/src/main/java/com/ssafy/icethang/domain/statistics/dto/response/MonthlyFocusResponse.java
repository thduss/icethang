package com.ssafy.icethang.domain.statistics.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class MonthlyFocusResponse {
    private LocalDate date;
    private Double averageFocusRate; // 해당 날짜의 평균 집중도
}