package com.ssafy.icethang.domain.monitoring.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ModeChangeRequest {
    private Long classId;  // 몇 반인지
    private String mode;   // 변경할 모드 ( "NORMAL", "DIGITAL")
}
