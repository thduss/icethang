package com.ssafy.icethang.global.security.oauth2.auth;

import java.util.Map;

public class NaverOAuth2UserInfo extends OAuth2UserInfo{
    public NaverOAuth2UserInfo(Map<String, Object> attributes) { super(attributes); }

    @Override
    public String getId() {
        // yml에서 user-name-attribute: response로 설정했기 때문에
        // attributes 맵에 바로 id, email 등이 들어있습니다.
        return (String) attributes.get("id");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }
}
