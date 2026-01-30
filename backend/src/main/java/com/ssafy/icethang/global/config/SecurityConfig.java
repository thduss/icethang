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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

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
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                // cors 설정
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // csrf 보안 끄기
                .csrf(AbstractHttpConfigurer::disable)

                // Form 로그인 & Basic 인증 끄기 (소셜 로그인만 할때)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // 세션 설정 (STATELESS)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 권한 설정 (누가 어디를 갈 수 있는지)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/css/**", "/images/**", "/js/**", "/favicon.ico", "/h2-console/**").permitAll() // 정적 리소스 허용
                        .requestMatchers("/error").permitAll()
                        // 로그인 관련
                        .requestMatchers("/auth/**", "/oauth2/**").permitAll()
                        // [경험치 조회 API] 학생과 선생님 모두 접근 가능하도록 설정
                        .requestMatchers("/classes/*/students/*/xp", "/themes/**").hasAnyRole("STUDENT", "TEACHER")
                        // [수정 API] 오직 선생님만 접근 가능하도록 설정
                        .requestMatchers("/classes/*/students/*/xp/give").hasRole("TEACHER")
                        .requestMatchers("/classes/*/session/**").hasRole("TEACHER")
                        // 소켓 연결
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/students/**", "/classes/**").authenticated()
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
                                // redirect_uri 쿠키에 저장
                                .authorizationRequestRepository(httpCookieOAuth2AuthorizationRequestRepository)
                        )
                );
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // cors 세부 설정 빈 추가
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 프론트엔드 주소 허용 (지금은 테스트용)
        configuration.setAllowedOriginPatterns(List.of("*"));

        // 허용 메서드
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 허용 헤더
        configuration.setAllowedHeaders(List.of("*"));

        // 쿠키, 인증 정보 허용
        configuration.setAllowCredentials(true);

        // 프론트에서 토큰 헤더를 읽을 수 있게 허용
        configuration.setExposedHeaders(List.of("Authorization", "Set-Cookie"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
