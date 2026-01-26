package com.ssafy.icethang.global.config;

import com.ssafy.icethang.domain.auth.service.CustomOAuth2UserService;
import com.ssafy.icethang.global.security.CustomUserDetailsService;
import com.ssafy.icethang.global.security.OAuth2FailureHandler;
import com.ssafy.icethang.global.security.OAuth2SuccessHandler;
import com.ssafy.icethang.global.security.TokenAuthenticationFilter;
import com.ssafy.icethang.global.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
// url 권한 관리, OAuth2 설정
// 로그인 성공하면 CustomOAuth2UserService 호출 -> DB 저장
public class SecurityConfig {
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenAuthenticationFilter tokenAuthenticationFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService); // 넌 이 서비스 써!
        authProvider.setPasswordEncoder(passwordEncoderr()); // 넌 이 암호화 방식 써!
        return authProvider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 보안 끄기
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Form 로그인 & Basic 인증 끄기 (우리는 소셜 로그인만 할때)
                // 나중에 통합 로그인시 다시 찾아보기
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // 3. 세션 설정 (나중에 JWT 쓸거면 STATELESS로 바꾸지만, 일단은 기본값 사용)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. 권한 설정 (누가 어디를 갈 수 있는지)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/css/**", "/images/**", "/js/**", "/favicon.ico", "/h2-console/**").permitAll() // 정적 리소스 허용
                        .requestMatchers("/auth/**", "/auth/refresh","/login/**", "/oauth2/**", "/api/students/join", "/classes").permitAll() // 로그인 관련 URL 허용
                        .requestMatchers("/auth/**").authenticated() // 로그인 로직 허용
                        .anyRequest().authenticated() // 나머지는 다 로그인 해야 함
                )

                // 5. 소셜 로그인 설정
                .oauth2Login(oauth2 -> oauth2
                        // 로그인 성공 시 이동할 페이지
                        .defaultSuccessUrl("/")

                        // 사용자 정보 가져오는 설정
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                        // 세션 대신 쿠키 쓰기
                        .authorizationEndpoint(authorization -> authorization
                                .baseUri("/oauth2/authorization")
                                .authorizationRequestRepository(httpCookieOAuth2AuthorizationRequestRepository)
                        )
                );
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoderr() {
        return new BCryptPasswordEncoder();
    }
}
