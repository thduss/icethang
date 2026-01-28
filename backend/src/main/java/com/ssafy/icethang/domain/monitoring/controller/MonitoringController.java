package com.ssafy.icethang.domain.monitoring.controller;

import com.ssafy.icethang.domain.monitoring.dto.AlertRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MonitoringController {
    private final SimpMessagingTemplate messagingTemplate;

    // 선생님한테 보낼 소켓 주소 : /app/alert
    @MessageMapping("/alert")
    public void sendAlert(AlertRequest request) {
        // 로그 확인 (테스트)
        System.out.println("🚨 알람 수신: [" + request.getStudentName() + "] " + request.getType());

        // 선생님 구독 주소 : /topic/class/{반ID}
        // 구독 중인 선생님에게 바로 전송 (DB 저장 X)
        messagingTemplate.convertAndSend("/topic/class/" + request.getClassId(), request);

        // db에 저장
    }

}
