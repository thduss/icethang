package com.ssafy.icethang.domain.statistics.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SubjectStatisticsResponse {
    private String subject;        // 과목명
    private Double avgFocusRate;   // 과목별 평균 집중도
    private Long totalClassCount;  // 해당 과목을 공부한 총 횟수 (비중 계산용)
    private Double avgOutOfSeat;   // 과목별 평균 이탈 횟수
}