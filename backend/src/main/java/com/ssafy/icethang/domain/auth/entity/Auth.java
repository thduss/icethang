package com.ssafy.icethang.domain.auth.entity;

import com.ssafy.icethang.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter // 로그인 세터는 그냥 두기
@SQLDelete(sql = "UPDATE teachers SET deleted_at = CURRENT_TIMESTAMP WHERE teacher_id = ?")
@Table(name = "teachers")
@Where(clause = "deleted_at IS NULL")
public class Auth extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "teacher_id")
    private Long id;

    @Column(length = 100, unique = true, nullable = false)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private Schools school;

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