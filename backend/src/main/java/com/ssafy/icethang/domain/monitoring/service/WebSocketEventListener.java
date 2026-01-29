package com.ssafy.icethang.domain.monitoring.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    private final SimpMessagingTemplate messagingTemplate;

    // 반 별 접속자 수
    private final Map<Long, Integer> classUserCounts = new ConcurrentHashMap<>();

    // 세션 별 접속한 반 정보
    private final Map<String, Long> sessionClassMap = new ConcurrentHashMap<>();

    // 구독 감지
    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination(); // 발행 주소
        String sessionId = headerAccessor.getSessionId();

        if (destination != null && destination.startsWith("/topic/class/")) {
            try {
                // 주소에서 classId 파싱
                String[] parts = destination.split("/");

                // /topic/class/{id} 형태 구독일 때만 카운팅
                if (parts.length == 4) {
                    Long classId = Long.parseLong(parts[3]);

                    // 세션 정보 저장 (나갈 때 쓰려고)
                    sessionClassMap.put(sessionId, classId);

                    // 카운트 증가
                    classUserCounts.merge(classId, 1, Integer::sum);

                    // 인원수 전송
                    sendUserCount(classId);

                    log.info("➕ 입장: Class {}, Session {}, 현재 인원 {}", classId, sessionId, classUserCounts.get(classId));
                }
            } catch (NumberFormatException e) {
                log.warn("잘못된 구독 주소 형식: {}", destination);
            }
        }
    }

    // 연결 해제 감지
    @EventListener
    public void handleDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        // 이 세션이 어느 반에 있었는지 확인
        Long classId = sessionClassMap.get(sessionId);

        if (classId != null) {
            // 카운트 감소
            classUserCounts.computeIfPresent(classId, (key, count) -> count > 0 ? count - 1 : 0);

            // 맵에서 삭제
            sessionClassMap.remove(sessionId);

            // 변경된 인원수 전송
            sendUserCount(classId);

            log.info("➖ 퇴장: Class {}, Session {}, 현재 인원 {}", classId, sessionId, classUserCounts.get(classId));
        }
    }

    private void sendUserCount(Long classId) {
        int count = classUserCounts.getOrDefault(classId, 0);

        messagingTemplate.convertAndSend("/topic/class/" + classId + "/count", Map.of(
                "type", "USER_COUNT",
                "count", count
        ));
    }
}
