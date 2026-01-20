package com.ssafy.icethang.domain.auth.service;

import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.entity.AuthProvider;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import com.ssafy.icethang.global.security.UserPrincipal;
import com.ssafy.icethang.global.security.oauth2.auth.OAuth2UserInfo;
import com.ssafy.icethang.global.security.oauth2.auth.OAuth2UserInfoFactory;
import jakarta.transaction.Transactional;
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
            return processOAuth2User(userRequest, oAuth2User);
        } catch (Exception ex) {
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 네이버 response 태그 찾기 추가
        Map<String, Object> attributes = oAuth2User.getAttributes();
        if ("naver".equals(registrationId)) {
            attributes = (Map<String, Object>) attributes.get("response");
        }

        // 1. Factory를 통해 카카오/네이버 등 구별 없이 정보 추출
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

        if (userInfo.getEmail() == null || userInfo.getEmail().isEmpty()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        // 2. DB 조회
        Optional<Auth> authOptional = authRepository.findByEmail(userInfo.getEmail());
        Auth auth;

        if (authOptional.isPresent()) {
            auth = authOptional.get();

            // 2-1. 다른 소셜로 가입된 이메일인지 체크
            if (auth.getProvider() != AuthProvider.valueOf(registrationId.toUpperCase())) {
                throw new OAuth2AuthenticationException(
                        "Looks like you're signed up with " + auth.getProvider() + " account. Please use your " + auth.getProvider() + " account to login."
                );
            }

            // 2-2. 탈퇴한 유저 복구 로직 (소프트 딜리트 해제)
            if (auth.getDeletedAt() != null) {
                log.info("Restoring deleted user: {}", auth.getEmail());
                auth.setDeletedAt(null); // 복구!
            }

            // 2-3. 정보 업데이트
            auth = updateExistingUser(auth, userInfo);

        } else {
            // 3. 신규 가입
            auth = registerNewUser(userRequest, userInfo);
        }

        return UserPrincipal.create(auth, oAuth2User.getAttributes());
    }

    private Auth registerNewUser(OAuth2UserRequest userRequest, OAuth2UserInfo userInfo) {
        Auth auth = new Auth();
        auth.setProvider(AuthProvider.valueOf(userRequest.getClientRegistration().getRegistrationId().toUpperCase()));
        auth.setProviderId(userInfo.getId());
        auth.setTeacherName(userInfo.getName());
        auth.setEmail(userInfo.getEmail());
        auth.setSchoolId(0); // 기본값

        return authRepository.save(auth);
    }

    private Auth updateExistingUser(Auth existingAuth, OAuth2UserInfo userInfo) {
        existingAuth.setTeacherName(userInfo.getName());
        return authRepository.save(existingAuth);
    }
}
