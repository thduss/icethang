package com.ssafy.icethang.domain.auth.controller;

import com.ssafy.icethang.domain.auth.dto.request.LoginRequest;
import com.ssafy.icethang.domain.auth.dto.request.SignupRequest;
import com.ssafy.icethang.domain.auth.dto.request.UpdateUserRequest;
import com.ssafy.icethang.domain.auth.dto.response.TokenRequestDto;
import com.ssafy.icethang.domain.auth.dto.response.TokenResponseDto;
import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.service.AuthService;
import com.ssafy.icethang.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    // 선생님 회원가입
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest request){
        authService.signup(request);
        return ResponseEntity.ok("회원가입 성공");
    }
    // 회원정보 조회
    @GetMapping("/me")
    public ResponseEntity<Auth> getMyInfo(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        // 토큰에서 해석된 이메일로 DB 조회
        Auth auth = authService.getUser(userPrincipal.getEmail());
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
    public ResponseEntity<TokenResponseDto> login(@RequestBody LoginRequest request) {

        // 토큰을 헤더에 넣을지 바디에 넣을지는 프론트랑 합의 (보통 바디나 헤더)
        return ResponseEntity.ok(authService.login(request));
    }

    // 토큰 재발급
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponseDto> reissue(@RequestBody TokenRequestDto request){
        return ResponseEntity.ok(authService.reissue(request));
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String accessToken,
                                         @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // bearer 떼기
        String token = accessToken.substring(7);

        authService.logout(token, userPrincipal.getEmail());
        return ResponseEntity.ok("로그아웃 되었습니다.");
    }
}
