package com.ssafy.icethang.domain.monitoring.service;

import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import com.ssafy.icethang.domain.monitoring.dto.ConnectedStudentDto;
import com.ssafy.icethang.domain.monitoring.dto.response.MonitoringAlertResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    private final SimpMessagingTemplate messagingTemplate;
    private final SocketSessionService socketSessionService;

    // 연결 해제 감지(퇴장 감지)
    @EventListener
    public void handleDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        // 서비스에서 학생 제거 (삭제된 학생 정보 받아옴)
        Long classId = socketSessionService.getClassIdBySession(sessionId);
        ConnectedStudentDto student = socketSessionService.removeStudent(sessionId);

        if (classId != null && student != null) {
            log.info("➖ 퇴장: 반={}, 학생={}", classId, student.getStudentName());

            // 선생님께 퇴장 알림 전송 (EXIT)
            MonitoringAlertResponse response = MonitoringAlertResponse.builder()
                    .type(AlertType.EXIT)
                    .studentId(student.getStudentId())
                    .studentName(student.getStudentName())
                    .studentNumber(student.getStudentNumber())
                    .message(student.getStudentName() + " 학생이 퇴장했습니다.")
                    .alertTime(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/class/" + classId, response);

            // 인원수 갱신 전송
            int count = socketSessionService.getClassUserCount(classId);
            messagingTemplate.convertAndSend("/topic/class/" + classId + "/count", Map.of(
                    "type", "USER_COUNT",
                    "count", count
            ));
        }
    }
}
