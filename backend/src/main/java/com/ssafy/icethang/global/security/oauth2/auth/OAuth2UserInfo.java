package com.ssafy.icethang.global.security.oauth2.auth;

import java.util.Map;

// JSON 모양을 통일시키는 껍데기
// 인터페이스
public abstract class OAuth2UserInfo {
    protected Map<String, Object> attributes;

    public OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public abstract String getId();
    public abstract String getName();
    public abstract String getEmail();
}
