package com.ssafy.icethang.domain.auth.service;

import com.ssafy.icethang.domain.auth.dto.request.LoginRequest;
import com.ssafy.icethang.domain.auth.dto.request.SignupRequest;
import com.ssafy.icethang.domain.auth.dto.request.UpdateUserRequest;
import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.entity.AuthProvider;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import com.ssafy.icethang.global.security.TokenProvider;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

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

    public String login(LoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());

        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        String accessToken = tokenProvider.createToken(authentication);

        return accessToken;
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
}
