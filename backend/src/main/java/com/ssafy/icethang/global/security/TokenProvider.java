package com.ssafy.icethang.global.security;

import com.ssafy.icethang.global.config.AppProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Collections;
import java.util.Date;

@Slf4j
@Service
// 토큰 생성, 검증, 해석
public class TokenProvider {
    private static final Logger logger = LoggerFactory.getLogger(TokenProvider.class);

    private final AppProperties appProperties;
    private final Key key;


    public TokenProvider(AppProperties appProperties) {
        this.appProperties = appProperties;

        // 1. yml에 있는 비밀키를 가져와서
        String secret = appProperties.getAuth().getTokenSecret();

        // 2. Base64로 디코딩 후 Key 객체로 변환
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // 리프레시 토큰 유효기간: 14일
    private static final long REFRESH_TOKEN_EXPIRE_TIME = 1000 * 60 * 60 * 24 * 14;

    // 엑세스 토큰 생성
    public String createToken(Authentication authentication) {
        String email = authentication.getName();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + appProperties.getAuth().getTokenExpirationMsec());

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    // 리프레시 토큰 생성
    public String createRefreshToken(Authentication authentication) {
        String email = authentication.getName();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + REFRESH_TOKEN_EXPIRE_TIME);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }

    // 토큰에서 인증 정보 꺼내기
    public Authentication getAuthentication(String accessToken) {

        Claims claims = parseClaims(accessToken);

        // 권한 정보가 없으면 기본 권한(USER) 부여 (필요에 따라 로직 수정 가능)

        // UserDetails 객체를 만들어서 Authentication 리턴
        // 비밀번호는 모르니까 빈 문자열("")
        User principal = new User(claims.getSubject(), "", Collections.emptyList());

        return new UsernamePasswordAuthenticationToken(principal, accessToken, Collections.emptyList());
    }

    // 헬퍼 메서드
    private Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(accessToken)
                    .getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    // 토큰 유효시간
    public Long getExpiration(String accessToken){
        Date expiration = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(accessToken)
                .getBody()
                .getExpiration();

        Long now  = new Date().getTime();
        return (expiration.getTime() - now);
    }

    // 토큰에서 Email 추출
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // 토큰 유효성 검증
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            logger.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty.");
        }
        return false;
    }
}
