package com.ssafy.icethang.global.security;

import com.ssafy.icethang.global.redis.RedisService;
import com.ssafy.icethang.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import com.ssafy.icethang.global.utill.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.Optional;

import static com.ssafy.icethang.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final TokenProvider tokenProvider;
    private final RedisService redisService;
    private final CookieUtil cookieUtil;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {

        // 1. 토큰 생성
        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String email = userPrincipal.getEmail();

        // redis에 리프레쉬 토큰 저장
        redisService.setValues(email, refreshToken, Duration.ofDays(7));

        // 쿠키 굽기
        cookieUtil.addTokenCookies(response, accessToken, refreshToken);

        // 4. 리다이렉트 설정
        String targetUrl = determineTargetUrl(request, response, authentication, accessToken);

        if (response.isCommitted()) {
            return;
        }

        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication, String accessToken) {
        // 로그인 요청시 보낸 redirect_uri 쿠키 찾기
        Optional<String> redirectUri = CookieUtil.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(Cookie::getValue);

        int serverPort = request.getServerPort();
        String defaultAppScheme = (serverPort == 8082)
                ? "icethang-dev://oauth2/redirect"  // 개발 서버
                : "icethang://oauth2/redirect";     // 배포 서버

        // 나중에 프론트엔드 주소로 바꿔야 함
        String targetUrl = redirectUri.orElse(defaultAppScheme);

        return UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", accessToken)
                .build().toUriString();
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}
