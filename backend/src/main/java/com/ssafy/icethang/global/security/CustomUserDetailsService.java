package com.ssafy.icethang.global.security;

import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
// security 통과 위해 userdetails로 변환해서 주는 클래스
public class CustomUserDetailsService implements UserDetailsService {

    private final AuthRepository authRepository;

    @Override
    @Transactional
    // DB에서 이메일로 유저 찾기
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        Auth auth = authRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        return UserPrincipal.create(auth);
    }
}
