package com.ssafy.icethang.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // STOMP 사용 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 메시지 구독 요청 (선생님이 듣는 주소)
        config.enableSimpleBroker("/topic");

        // 메시지 발행 요청 (학생이 보내는 주소)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 소켓 연결 주소
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // CORS 허용 (배포 시 프론트 주소로 변경 권장)
                .withSockJS(); // 포스트맨 테스트시 주의
    }
}