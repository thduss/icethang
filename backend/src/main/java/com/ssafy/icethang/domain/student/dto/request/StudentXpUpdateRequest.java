package com.ssafy.icethang.domain.student.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
// 경험치 수정 dto
public class StudentXpUpdateRequest {
    private Integer amount;
    private String reason;
}
