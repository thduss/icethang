package com.ssafy.icethang.domain.monitoring.dto.request;

import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertRequest {
    private Long classId;       // 구독 채널 식별용 (반 ID)
    private Long studentId;
    private String studentName;
    private AlertType type;
}
