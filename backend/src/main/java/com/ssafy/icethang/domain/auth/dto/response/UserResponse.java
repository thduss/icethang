package com.ssafy.icethang.domain.auth.dto.response;

import com.ssafy.icethang.domain.auth.entity.Auth;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String teacherName;
    private Integer schoolId;
    private String provider;

    public static UserResponse from(Auth auth) {
        return UserResponse.builder()
                .id(auth.getId())
                .email(auth.getEmail())
                .teacherName(auth.getTeacherName())
                .schoolId(auth.getSchool() != null ? auth.getSchool().getSchoolId() : null)
                .provider(auth.getProvider().name())
                .build();
    }
}