package com.ssafy.icethang.domain.auth.service;

import com.ssafy.icethang.domain.auth.dto.request.LoginRequest;
import com.ssafy.icethang.domain.auth.dto.request.SignupRequest;
import com.ssafy.icethang.domain.auth.dto.request.UpdateUserRequest;
import com.ssafy.icethang.domain.auth.dto.response.TokenResponseDto;
import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.entity.AuthProvider;
import com.ssafy.icethang.domain.auth.entity.Schools;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import com.ssafy.icethang.domain.auth.repository.SchoolsRepository;
import com.ssafy.icethang.global.redis.RedisService;
import com.ssafy.icethang.global.security.CustomUserDetailsService;
import com.ssafy.icethang.global.security.TokenProvider;
import com.ssafy.icethang.global.security.oauth2.auth.KakaoOAuth2UserInfo;
import com.ssafy.icethang.global.security.oauth2.auth.OAuth2UserInfo;
import com.ssafy.icethang.global.utill.NeisApiService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RedisService redisService;
    private final NeisApiService niceApiService;
    private final SchoolsRepository schoolsRepository;
    private final CustomUserDetailsService customUserDetailsService;

    @Transactional
    public String signup(SignupRequest request){
        // 1. 이메일 중복 검사
        if(authRepository.findByEmail(request.getEmail()).isPresent()){
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        // 2. 학교 정보 처리 (DB -> 없으면 nice API 호출)
        Schools school = schoolsRepository.findBySchoolName(request.getSchoolName())
                .orElseGet(() -> {
                    return niceApiService.searchAndSaveSchool(request.getSchoolName());
                });

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // (일반 로그인) 유저 저장
        Auth auth = new Auth();
        auth.setEmail(request.getEmail());
        auth.setPassword(encodedPassword);
        auth.setTeacherName(request.getTeacherName());
        auth.setSchool(school);
        auth.setProvider(AuthProvider.LOCAL);

        authRepository.save(auth);
        return auth.getEmail();
    }

    public TokenResponseDto login(LoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());

        // DB에 있는 비밀번호랑 비교
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        // 리프레시 토큰 redis에 저장
        redisService.setValues(
                request.getEmail(),
                refreshToken,
                Duration.ofDays(7)
        );

        return TokenResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();

    }

    // 토큰 재발급
    public TokenResponseDto reissue(String refreshToken) {
        // Refresh Token 검증
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Refresh Token이 유효하지 않습니다.");
        }

        // Refresh Token에서 이메일 가져오기
        String email = tokenProvider.getEmailFromToken(refreshToken);

        // Redis에서 저장된 Refresh Token 가져오기
        String redisRefreshToken = redisService.getValues(email);
        if (redisRefreshToken == null || !redisRefreshToken.equals(refreshToken)) {
            throw new RuntimeException("토큰의 유저 정보가 일치하지 않습니다.");
        }

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );

        // 새로운 토큰 생성
        String newAccessToken = tokenProvider.createToken(authentication);
        String newRefreshToken = tokenProvider.createRefreshToken(authentication);

        // Redis 업데이트
        redisService.setValues(email, newRefreshToken, Duration.ofDays(7));

        return TokenResponseDto.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }


    // 회원정보 조회
    @Transactional
    public Auth getUser(String email) {
        return authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
    }

    // 회원정보 수정
    @Transactional
    public void updateUser(String email, UpdateUserRequest request) {
        Auth auth = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        // 이름 변경 요청
        if (request.getTeacherName() != null) {
            auth.setTeacherName(request.getTeacherName());
        }

        // 비밀번호 변경 요청
        if (request.getPassword() != null) {
            auth.setPassword(passwordEncoder.encode(request.getPassword()));
        }
    }

    // 로그아웃
    @Transactional
    public void logout(String accessToken, String email){
        // redis 삭제
        if(redisService.getValues(email) != null){
            redisService.deleteValues(email);
        }

        Long expiration = tokenProvider.getExpiration(accessToken);
        redisService.setValues(accessToken, "logout", Duration.ofMillis(expiration));
    }

    @Transactional
    public TokenResponseDto loginWithKakao(String kakaoAccessToken) {
        // 1. 카카오 서버에서 유저 정보 가져오기
        OAuth2UserInfo userInfo = getKakaoUserInfoFromKakao(kakaoAccessToken);

        // 2. DB에 저장하거나 업데이트하기
        Auth auth = saveOrUpdate("kakao", userInfo);

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(auth.getEmail());
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );

        // 3. 우리 서버 전용 JWT 만들기
        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        redisService.setValues(auth.getEmail(), refreshToken, Duration.ofDays(7));

        return TokenResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    private OAuth2UserInfo getKakaoUserInfoFromKakao(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        var response = restTemplate.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET, entity, Map.class
        );

        return new KakaoOAuth2UserInfo(response.getBody());
    }

    private Auth saveOrUpdate(String registrationId, OAuth2UserInfo userInfo) {
        return authRepository.findByEmail(userInfo.getEmail())
                .map(auth -> {
                    auth.setTeacherName(userInfo.getName());
                    return authRepository.save(auth);
                })
                .orElseGet(() -> {
                    Schools defaultSchool = schoolsRepository.findById(1)
                            .orElseThrow(() -> new RuntimeException("기본 학교(ID: 1)가 DB에 없어요! SQL 확인해주세요 힝구.."));
                    Auth auth = new Auth();
                    auth.setEmail(userInfo.getEmail());
                    auth.setTeacherName(userInfo.getName());
                    auth.setProvider(AuthProvider.valueOf(registrationId.toUpperCase()));
                    auth.setSchool(defaultSchool);
                    auth.setProviderId(userInfo.getId());
                    return authRepository.save(auth);
                });
    }

}
