package com.ssafy.icethang.domain.student.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
// 자동 로그인할때(재입장)
public class StudentLoginRequest {
    private String deviceUuid;
}
