package com.ssafy.icethang.domain.student.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
// 최초 로그인
public class StudentJoinRequest {
    private String name;
    private Integer studentNumber;
    private String inviteCode;
    private String deviceUuid;
}
