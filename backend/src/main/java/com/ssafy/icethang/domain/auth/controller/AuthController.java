package com.ssafy.icethang.domain.auth.controller;

import com.ssafy.icethang.domain.auth.dto.request.LoginRequest;
import com.ssafy.icethang.domain.auth.dto.request.SignupRequest;
import com.ssafy.icethang.domain.auth.dto.request.UpdateUserRequest;
import com.ssafy.icethang.domain.auth.dto.response.TokenResponseDto;
import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.service.AuthService;
import com.ssafy.icethang.global.security.UserPrincipal;
import com.ssafy.icethang.global.utill.CookieUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final CookieUtil cookieUtil;

    // 선생님 회원가입
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest request){
        authService.signup(request);
        return ResponseEntity.ok("회원가입 성공");
    }
    // 회원정보 조회
    @GetMapping("/me")
    public ResponseEntity<Auth> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        Auth auth = authService.getUser(userDetails.getUsername());
        return ResponseEntity.ok(auth);
    }
    // 회원정보 수정
    @PatchMapping("/me")
    public ResponseEntity<String> updateMyInfo(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody UpdateUserRequest request) {

        authService.updateUser(userPrincipal.getEmail(), request);
        return ResponseEntity.ok("회원 정보가 수정되었습니다.");
    }

    // 학생 로그인

    // 선생님 로그인
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletResponse response) {
        TokenResponseDto tokenDto = authService.login(request);

        // 쿠키 유틸 불러서 굽기
        cookieUtil.addTokenCookies(response, tokenDto.getAccessToken(), tokenDto.getRefreshToken());

        return ResponseEntity.ok("로그인 성공");
    }

    // 토큰 재발급
    @PostMapping("/refresh")
    public ResponseEntity<?> reissue(@CookieValue("refreshToken") String refreshToken,
                                                    HttpServletResponse response){
        TokenResponseDto tokenDto = authService.reissue(refreshToken);

        // 새 토큰으로 쿠키 갱신
        cookieUtil.addTokenCookies(response, tokenDto.getAccessToken(), tokenDto.getRefreshToken());
        return ResponseEntity.ok("토큰 재발급 성공");
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String accessToken,
                                         @CookieValue(value = "accessToken", required = false) String cookieAccessToken,
                                         @CookieValue(value = "refreshToken", required = false) String refreshToken,
                                         @AuthenticationPrincipal UserDetails userDetails,
                                         HttpServletResponse response) {

        String token = null;
        if (accessToken != null && accessToken.startsWith("Bearer ")) {
            token = accessToken.substring(7);
        } else if (cookieAccessToken != null) {
            token = cookieAccessToken;
        }

        // 이미 토큰이 만료되어서 userPrincipal이 null이면 Redis 삭제는 스킵
        if (userDetails != null && token != null) {
            authService.logout(token, userDetails.getUsername());
        }

        // 쿠키 삭제
        cookieUtil.deleteTokenCookies(response);
        return ResponseEntity.ok("로그아웃 되었습니다.");
    }
}
