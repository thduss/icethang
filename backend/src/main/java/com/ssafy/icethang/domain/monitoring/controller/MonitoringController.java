package com.ssafy.icethang.domain.monitoring.controller;

import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import com.ssafy.icethang.domain.monitoring.dto.request.AlertRequest;
import com.ssafy.icethang.domain.monitoring.dto.request.ModeChangeRequest;
import com.ssafy.icethang.domain.monitoring.dto.response.MonitoringAlertResponse;
import com.ssafy.icethang.domain.monitoring.entity.ClassEventLog;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import com.ssafy.icethang.domain.monitoring.repository.ClassEventLogRepository;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.domain.student.repository.StudyLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Controller
@RequiredArgsConstructor
public class MonitoringController {
    private final SimpMessagingTemplate messagingTemplate;
    private final StudentRepository studentRepository;
    private final StudyLogRepository studyLogRepository;
    private final ClassEventLogRepository classEventLogRepository;

    // 학생 -> 선생님 : 선생님이 학생을 구독하여 학생쪽에서 선생님에게 발행 함
    // 선생님한테 보낼 소켓 주소 : /app/alert
    @MessageMapping("/alert")
    public void sendAlert(AlertRequest request) {
        // 로그 확인 (테스트)
        log.info("🚨 알람 수신: [{}] {}", request.getStudentName(), request.getType());

        // 학생 조회
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("학생 없음"));

        StudyLog parentLog = studyLogRepository.findTopByStudentAndDateOrderByCreatedAtDesc(student, LocalDate.now())
                .orElseGet(() -> createPlaceholderLog(student));

        // 프론트에서 넘어온시간이 없다면 서버 시간 쓰기
        LocalDateTime eventTime = (request.getDetectedAt() != null)
                ? request.getDetectedAt()
                : LocalDateTime.now();

        // 상세 이벤트 로그 저장
        ClassEventLog eventLog = ClassEventLog.builder()
                .student(student)
                .studyLog(parentLog)
                .eventType(request.getType())
                .detectedAt(eventTime) // 결정된 시간 저장
                .build();
        classEventLogRepository.save(eventLog);

        // 누적 이탈 횟수 계산
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        long awayCount = classEventLogRepository.countByStudentAndEventTypeToday(
                student, AlertType.AWAY, startOfDay, endOfDay);
        long unfocusCount = classEventLogRepository.countByStudentAndEventTypeToday(
                student, AlertType.UNFOCUS, startOfDay, endOfDay);

        // 응답 생성
        String alertMsg = makeAlertMessage(student.getName(), request.getType());

        MonitoringAlertResponse response = MonitoringAlertResponse.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .studentNumber(student.getStudentNumber())
                .type(request.getType())
                .message(alertMsg)
                .alertTime(eventTime) // [적용] 응답에도 동일한 시간 사용
                .totalAwayCount(awayCount)
                .totalUnfocusCount(unfocusCount)
                .build();

        // 구독 중인 선생님에게 바로 전송 (DB 저장 X)
        messagingTemplate.convertAndSend("/topic/class/" + request.getClassId(), response);

    }

    // 수업 로그가 없을 때 임시로 생성하는 헬퍼 메서드
    private StudyLog createPlaceholderLog(Student student) {
        StudyLog newLog = StudyLog.builder()
                .student(student)
                .subject("임시")
                .classNo(0)      // 0교시로 처리
                .build();
        return studyLogRepository.save(newLog); // DB에 저장하고 객체 반환
    }

    private String makeAlertMessage(String name, AlertType type) {
        if (type == AlertType.AWAY) return name + " 학생이 수업에서 이탈했습니다.";
        if (type == AlertType.UNFOCUS) return name + " 학생이 집중하지 않고 있습니다.";
        if (type == AlertType.FOCUS) return name + " 학생이 집중을 잘 하고 있습니다.";
        return name + " 학생에게 알림이 발생했습니다.";
    }

    // 선생님 -> 학생들 : 학생들이 선생님을 구독하여 선생님쪽에서 반 학생들에게 발행함
    // 학생들에게 보낼 소켓 주소 : /app/mode
    @MessageMapping("/mode")
    public void changeMode(ModeChangeRequest request) {
        log.info("🔄 모드 변경 요청: {}반 -> {}", request.getClassId(), request.getMode());

        // 해당 반 학생들에게 모드 변경 신호 전송
        messagingTemplate.convertAndSend("/topic/class/" + request.getClassId() + "/mode", request);
    }
}
