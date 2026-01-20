package com.ssafy.icethang.domain.auth.controller;

import com.ssafy.icethang.domain.auth.dto.request.LoginRequest;
import com.ssafy.icethang.domain.auth.dto.request.SignupRequest;
import com.ssafy.icethang.domain.auth.dto.request.UpdateUserRequest;
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
    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // JWT는 원래 서버에서 할 게 없다(?)
        // 클라이언트가 자기 폰에서 토큰 지우면 그게 로그아웃
        // 나중에 리프레시 토큰 생기면 여기서 DB의 리프레시 토큰을 지워야 한다(?)
        return ResponseEntity.ok("로그아웃 되었습니다. (프론트에서 토큰을 삭제하세요)");
    }

    // 학생 로그인

    // 선생님 로그인
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        // 토큰을 헤더에 넣을지 바디에 넣을지는 프론트랑 합의 (보통 바디나 헤더)
        return ResponseEntity.ok(token);
    }

    // 토큰 재발급
}
