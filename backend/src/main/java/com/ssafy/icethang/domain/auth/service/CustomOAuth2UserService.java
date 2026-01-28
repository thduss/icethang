package com.ssafy.icethang.domain.auth.service;

import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.entity.AuthProvider;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import com.ssafy.icethang.global.security.UserPrincipal;
import com.ssafy.icethang.global.security.oauth2.auth.OAuth2UserInfo;
import com.ssafy.icethang.global.security.oauth2.auth.OAuth2UserInfoFactory;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService{
    private final AuthRepository authRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        try {
            // 받아온 정보를 db에 업데이트
            return processOAuth2User(userRequest, oAuth2User);
        } catch (Exception ex) {
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 네이버 response 키 찾아서 정보 꺼내기
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("naver".equals(registrationId)) {
            attributes = (Map<String, Object>) attributes.get("response");
        }

        // Factory를 통해 카카오/네이버 등 구별 없이 json 정보 추출
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

        // 이메일 가져와야하므로 없으면 예외 발생
        if (userInfo.getEmail() == null || userInfo.getEmail().isEmpty()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        // 이메일로 DB 조회(기존 회원인지 검증)
        Optional<Auth> authOptional = authRepository.findByEmail(userInfo.getEmail());
        Auth auth;

        if (authOptional.isPresent()) {
            auth = authOptional.get();

            // 다른 소셜로 가입된 이메일인지 체크(provider가 다른지 확인)
            if (auth.getProvider() != AuthProvider.valueOf(registrationId.toUpperCase())) {
                throw new OAuth2AuthenticationException(
                        "Looks like you're signed up with " + auth.getProvider() + " account. Please use your " + auth.getProvider() + " account to login."
                );
            }

            // 탈퇴한 유저 복구 로직 (soft delete로 인한 재가입시 발생 문제 해결)
            if (auth.getDeletedAt() != null) {
                log.info("Restoring deleted user: {}", auth.getEmail());
                auth.setDeletedAt(null);
            }

            //  정보 업데이트
            auth = updateExistingUser(auth, userInfo);

        } else {
            // 신규 가입
            auth = registerNewUser(userRequest, userInfo);
        }

        return UserPrincipal.create(auth, attributes);
    }

    // 신규 가입
    private Auth registerNewUser(OAuth2UserRequest userRequest, OAuth2UserInfo userInfo) {
        Auth auth = new Auth();
        auth.setProvider(AuthProvider.valueOf(userRequest.getClientRegistration().getRegistrationId().toUpperCase()));
        auth.setProviderId(userInfo.getId());
        auth.setTeacherName(userInfo.getName());
        auth.setEmail(userInfo.getEmail());
        auth.setSchoolId(0); // 기본값

        return authRepository.save(auth);
    }

    // 로그인할때마다 최신 소셜 정보 가져와서 db 저장하기
    private Auth updateExistingUser(Auth existingAuth, OAuth2UserInfo userInfo) {
        existingAuth.setTeacherName(userInfo.getName());
        return authRepository.save(existingAuth);
    }
}
