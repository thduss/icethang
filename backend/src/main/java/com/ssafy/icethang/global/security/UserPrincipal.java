package com.ssafy.icethang.global.security;

import com.ssafy.icethang.domain.auth.entity.Auth;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Getter
public class UserPrincipal implements OAuth2User, UserDetails {

    private Long id;
    private String email;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
    private Map<String, Object> attributes;

    // 생성자
    public UserPrincipal(Long id, String email, String password, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
    }

    // 일반 로그인 JWT
    public static UserPrincipal create(Auth auth) {
        // 권한 설정 (일단 모두 USER로 통일)
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_USER")
        );

        return new UserPrincipal(
                auth.getId(),
                auth.getEmail(),
                auth.getPassword(),
                authorities
        );
    }

    // 소셜로그인 전용
    public static UserPrincipal create(Auth auth, Map<String, Object> attributes) {
        UserPrincipal userPrincipal = UserPrincipal.create(auth);
        userPrincipal.setAttributes(attributes);
        return userPrincipal;
    }
    // -------------------------------------
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getName() {
        return email; // 소셜 로그인에서 식별자로 이메일 사용
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    // 계정 상태 체크 (일단 모두 true로 설정해서 패스)
    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }

}
