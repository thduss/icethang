package com.ssafy.icethang.global.security;

import com.ssafy.icethang.global.redis.RedisService;
import com.ssafy.icethang.global.utill.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final TokenProvider tokenProvider;
    private final RedisService redisService;
    private final CookieUtil cookieUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String email = userPrincipal.getEmail();
        // 1. 토큰 생성
        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        // 2. Redis에 Refresh Token 저장

        redisService.setValues(email, refreshToken, Duration.ofDays(7));

        // 3. 쿠키 굽기
        cookieUtil.addTokenCookies(response, accessToken, refreshToken);

        // 4. 리다이렉트 설정
        // 나중에 프론트엔드 주소로 설정
        // 아마도 리액트 3000번일듯
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:8080/")
                .build().toUriString();

        if (response.isCommitted()) {
            return;
        }

        // 4. 프론트엔드로 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
