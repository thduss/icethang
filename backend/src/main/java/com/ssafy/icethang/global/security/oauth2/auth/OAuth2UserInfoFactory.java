package com.ssafy.icethang.global.security.oauth2.auth;

import com.ssafy.icethang.domain.auth.entity.AuthProvider;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

import java.util.Map;

// 소셜 로그인 종류에 따라 소셜 처리
public class OAuth2UserInfoFactory {
    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        if (AuthProvider.KAKAO.name().equalsIgnoreCase(registrationId)) {
            return new KakaoOAuth2UserInfo(attributes);
        }else if (registrationId.equalsIgnoreCase("naver")) {
            return new NaverOAuth2UserInfo(attributes);
        }
        throw new OAuth2AuthenticationException("Sorry! Login with " + registrationId + " is not supported yet.");
    }
}
