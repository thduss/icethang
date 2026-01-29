package com.ssafy.icethang.domain.statistics.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class WeeklyFocusResponse {
    private LocalDate date;
    private String dayOfWeek;      // 요일 (MON, TUE...)
    private Double averageFocusRate; // 해당 날짜 평균 집중도
}