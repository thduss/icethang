package com.ssafy.icethang.domain.monitoring.controller;

import com.ssafy.icethang.domain.monitoring.dto.request.AlertRequest;
import com.ssafy.icethang.domain.monitoring.dto.request.ModeChangeRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class MonitoringController {
    private final SimpMessagingTemplate messagingTemplate;

    // 학생 -> 선생님 : 선생님이 학생을 구독하여 학생쪽에서 선생님에게 발행 함
    // 선생님한테 보낼 소켓 주소 : /app/alert
    @MessageMapping("/alert")
    public void sendAlert(AlertRequest request) {
        // 로그 확인 (테스트)
        log.info("🚨 알람 수신: [{}] {}", request.getStudentName(), request.getType());

        // 구독 중인 선생님에게 바로 전송 (DB 저장 X)
        messagingTemplate.convertAndSend("/topic/class/" + request.getClassId(), request);

        // db에 저장
    }

    // 선생님 -> 학생들 : 학생들이 선생님을 구독하여 선생님쪽에서 반 학생들에게 발행함
    // 학생들에게 보낼 소켓 주소 : /app/mode
    @MessageMapping("/mode")
    public void changeMode(ModeChangeRequest request) {
        System.out.println("🔄 모드 변경 요청: " + request.getClassId() + "반 -> " + request.getMode());

        // 해당 반 학생들에게 모드 변경 신호 전송
        messagingTemplate.convertAndSend("/topic/class/" + request.getClassId() + "/mode", request);
    }
}
