package com.ssafy.icethang.global.security;

import com.ssafy.icethang.domain.auth.entity.Auth;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class UserPrincipal implements OAuth2User{
    private Auth auth;
    private Map<String, Object> attributes;

    public UserPrincipal(Auth auth, Map<String, Object> attributes) {
        this.auth = auth;
        this.attributes = attributes;
    }

    public static UserPrincipal create(Auth auth, Map<String, Object> attributes) {
        return new UserPrincipal(auth, attributes);
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getName() {
        return auth.getEmail(); // PK인 이메일을 주 식별자로 사용
    }
}
