package com.ssafy.icethang.domain.monitoring.dto.response;

import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class MonitoringAlertResponse {
    // student 기본 정보
    private Long studentId;
    private String studentName;
    private Integer studentNumber;

    // 알람 상세 정보
    private AlertType type;        // 상태 (AWAY, UNFOCUS ,FOCUS)
    private String message;        // "김싸피 수업에서 이탈했습니다."
    private LocalDateTime alertTime; // 알람 발생 시각

    // 이번 교시 누적 통계
    private long totalAwayCount;    // 오늘 이탈 횟수
    private long totalUnfocusCount; // 오늘 딴짓 횟수
}
