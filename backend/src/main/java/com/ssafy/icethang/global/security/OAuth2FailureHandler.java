package com.ssafy.icethang.global.security;

import com.ssafy.icethang.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import com.ssafy.icethang.global.utill.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {

        // 에러 메시지 담아서 보낼 주소
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:8080/") // 나중에 프론트 주소로 변경
                .queryParam("error", exception.getLocalizedMessage())
                .build().toUriString();

        // 쿠키 청소
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        // 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
