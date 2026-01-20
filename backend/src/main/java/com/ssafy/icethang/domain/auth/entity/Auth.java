package com.ssafy.icethang.domain.auth.entity;

import com.ssafy.icethang.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "teachers")
@Getter
@Setter // 로그인 세터는 그냥 두기
public class Auth extends BaseEntity {

    @Id
    @Column(length = 100)
    private String email;

    private Integer schoolId;

    @Column(nullable = false)
    private String teacherName;

    // 소셜로그인은 password 필요없으니까 null허용
    @Column(nullable = true)
    private String password;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    @Column(name = "provider_id")
    private String providerId;

    private String refreshToken;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}