package com.ssafy.icethang.domain.auth.service;

import com.ssafy.icethang.domain.auth.dto.request.SignupRequest;
import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.entity.AuthProvider;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public String signup(SignupRequest request){
        // 이메일 중복 검사
        if(authRepository.findByEmail(request.getEmail()).isPresent()){
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 유저 저장
        Auth auth = new Auth();
        auth.setEmail(request.getEmail());
        auth.setPassword(encodedPassword);
        auth.setTeacherName(request.getTeacherName());
        auth.setProvider(AuthProvider.LOCAL); // 일반 가입 표시
        auth.setSchoolId(0);

        Auth savedAuth = authRepository.save(auth);
        return savedAuth.getEmail();
    }
}
