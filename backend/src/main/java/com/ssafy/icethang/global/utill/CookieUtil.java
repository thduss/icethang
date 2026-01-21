package com.ssafy.icethang.global.utill;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    private static final String ACCESS_TOKEN_NAME = "accessToken";
    private static final String REFRESH_TOKEN_NAME = "refreshToken";

    // 우리 컨트롤러가 "/auth" 이므로
    private static final String REFRESH_TOKEN_PATH = "/auth";

    // 토큰 유효시간
    private static final int ACCESS_TOKEN_AGE = 30 * 60; // 30분
    private static final int REFRESH_TOKEN_AGE = 7 * 24 * 60 * 60; // 7일

    // 1. 쿠키 굽기
    public void addTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        // Access Token 쿠키
        ResponseCookie accessCookie = ResponseCookie.from(ACCESS_TOKEN_NAME, accessToken)
                .path("/")
                .httpOnly(true)
                .secure(false)  //  배포(https)땐 true
                .maxAge(ACCESS_TOKEN_AGE)
                .sameSite("Lax")
                .build();

        // Refresh Token 쿠키
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_TOKEN_NAME, refreshToken)
                .path(REFRESH_TOKEN_PATH)
                .httpOnly(true)
                .secure(false)
                .maxAge(REFRESH_TOKEN_AGE)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", accessCookie.toString());
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }

    // 2. 쿠키 삭제 (로그아웃)
    public void deleteTokenCookies(HttpServletResponse response) {
        // Access Token 삭제 (MaxAge = 0)
        ResponseCookie accessCookie = ResponseCookie.from(ACCESS_TOKEN_NAME, "")
                .path("/")
                .httpOnly(true)
                .secure(false)
                .maxAge(0)
                .sameSite("Lax")
                .build();

        // Refresh Token 삭제 (MaxAge = 0)
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_TOKEN_NAME, "")
                .path(REFRESH_TOKEN_PATH)
                .httpOnly(true)
                .secure(false)
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", accessCookie.toString());
        response.addHeader("Set-Cookie", refreshCookie.toString());
    }
}
