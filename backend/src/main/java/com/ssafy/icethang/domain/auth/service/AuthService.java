package com.ssafy.icethang.domain.auth.service;

import com.ssafy.icethang.domain.auth.dto.request.LoginRequest;
import com.ssafy.icethang.domain.auth.dto.request.SignupRequest;
import com.ssafy.icethang.domain.auth.dto.request.UpdateUserRequest;
import com.ssafy.icethang.domain.auth.dto.response.TokenResponseDto;
import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.entity.AuthProvider;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import com.ssafy.icethang.global.redis.RedisService;
import com.ssafy.icethang.global.security.TokenProvider;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RedisService redisService;

    @Transactional
    public String signup(SignupRequest request){
        // 이메일 중복 검사
        if(authRepository.findByEmail(request.getEmail()).isPresent()){
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // (일반 로그인) 유저 저장
        Auth auth = new Auth();
        auth.setEmail(request.getEmail());
        auth.setPassword(encodedPassword);
        auth.setTeacherName(request.getTeacherName());
        auth.setProvider(AuthProvider.LOCAL);
        auth.setSchoolId(0);

        authRepository.save(auth);
        return auth.getEmail();
    }

    public TokenResponseDto login(LoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());

        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        redisService.setValues(
                request.getEmail(), // Key
                refreshToken,       // Value
                Duration.ofDays(7)  // Duration
        );

        return TokenResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();

    }

    // 토큰 재발급
    public TokenResponseDto reissue(String refreshToken) {
        // 1. Refresh Token 검증
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Refresh Token이 유효하지 않습니다.");
        }

        // 2. Refresh Token에서 User ID(이메일) 가져오기
        Authentication authentication = tokenProvider.getAuthentication(refreshToken);
        String email = authentication.getName();

        // 3. Redis에서 저장된 Refresh Token 가져오기
        String redisRefreshToken = redisService.getValues(email);

        // 4. 검사: Redis에 없거나, 요청온 토큰과 다르면 에러
        if (redisRefreshToken == null || !redisRefreshToken.equals(refreshToken)) {
            throw new RuntimeException("토큰의 유저 정보가 일치하지 않습니다.");
        }

        // 5. 새로운 토큰 생성
        String newAccessToken = tokenProvider.createToken(authentication);
        String newRefreshToken = tokenProvider.createRefreshToken(authentication);

        // 6. Redis 업데이트
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

    @Transactional
    public void logout(String accessToken, String email){
        if(redisService.getValues(email) != null){
            redisService.deleteValues(email);
        }

        Long expiration = tokenProvider.getExpiration(accessToken);
        redisService.setValues(accessToken, "logout", Duration.ofMillis(expiration));
    }
}
