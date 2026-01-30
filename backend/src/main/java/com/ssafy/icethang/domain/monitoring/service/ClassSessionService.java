package com.ssafy.icethang.domain.monitoring.service;

import com.ssafy.icethang.domain.classgroup.dto.request.ClassSessionEndRequest;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import com.ssafy.icethang.domain.monitoring.entity.ClassEventLog;
import com.ssafy.icethang.domain.monitoring.repository.ClassEventLogRepository;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.domain.student.repository.StudyLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassSessionService {

    private final StudentRepository studentRepository;
    private final StudyLogRepository studyLogRepository;
    private final ClassGroupRepository classGroupRepository;
    private final ClassEventLogRepository classEventLogRepository;

    public void startClass(Long classId) {
        if (!classGroupRepository.existsById(classId)) {
            throw new IllegalArgumentException("존재하지 않는 반입니다.");
        }
        log.info("Class {} 수업 시작 신호 수신", classId);
    }

    @Transactional
    public void endClass(Long classId, ClassSessionEndRequest request) {
        // 테스트 코드
        log.info("========== [수업 종료 정산 시작] ==========");
        log.info("요청 정보: 날짜={}, 시간={} ~ {}", request.getDate(), request.getStartTime(), request.getEndTime());
        List<Student> students = studentRepository.findAllByClassGroupId(classId);

        for (Student student : students) {
            // 테스트 코드
            log.info("--------------------------------------------------");
            log.info(">> 학생: {} (ID: {}) 계산 시작", student.getName(), student.getId());

            // 미처리 이벤트 로그 조회
            List<ClassEventLog> events = classEventLogRepository.findAllByStudentAndStudyLogIsNullOrderByDetectedAtAsc(student);
            log.info("   -> DB에서 가져온 미처리 이벤트 개수: {}개", events.size());

            if (events.isEmpty()) {
                log.warn("   -> ⚠️ 이벤트가 0개입니다. (집중도 100% 확정)");
            }

            // 집중도 계산
            long totalSeconds = Duration.between(request.getStartTime(), request.getEndTime()).getSeconds();
            if (totalSeconds <= 0) totalSeconds = 1;

            long lossSeconds = calculateLossTime(events, request);
            int focusRate = (int) (((double)(totalSeconds - lossSeconds) / totalSeconds) * 100);
            focusRate = Math.max(0, Math.min(100, focusRate));

            log.info("   -> 📊 최종 결과: 총 수업 {}초, 비집중 {}초, 집중도 {}%", totalSeconds, lossSeconds, focusRate);

            int awayCount = (int) events.stream().filter(e -> e.getEventType() == AlertType.AWAY).count();

            // StudyLog 생성
            StudyLog studyLog = StudyLog.builder()
                    .student(student)
                    .date(request.getDate())
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .subject(null) // 후 처리 필요
                    .classNo(0)    // 후 처리 필요
                    .focusRate(focusRate)
                    .outofseatCount(awayCount)
                    .build();

            studyLogRepository.save(studyLog);
            log.info("   -> StudyLog 저장 완료 (ID: {})", studyLog.getId());

            // 이벤트 로그에 부모 연결
            for (ClassEventLog event : events) {
                event.updateStudyLog(studyLog);
            }
        }
        log.info("========== [수업 종료 정산 끝] ==========");
    }

    private long calculateLossTime(List<ClassEventLog> events, ClassSessionEndRequest request) {
        long lossSeconds = 0;
        LocalDateTime lastLossStart = null;
        LocalDateTime classStartDateTime = LocalDateTime.of(request.getDate(), request.getStartTime());
        LocalDateTime classEndDateTime = LocalDateTime.of(request.getDate(), request.getEndTime());

        log.info("   🔍 [Loss Time 계산 상세]");
        log.info("      수업 범위: {} ~ {}", classStartDateTime, classEndDateTime);

        for (ClassEventLog event : events) {
            // 테스트
            String type = event.getEventType().toString();
            LocalDateTime time = event.getDetectedAt();

            // 1. 범위 체크
            if (time.isBefore(classStartDateTime)) {
                log.info("      ❌ [Skip] 수업 전 이벤트: {} ({})", time, type);
                continue;
            }
            if (time.isAfter(classEndDateTime)) {
                log.info("      ❌ [Skip] 수업 후 이벤트: {} ({})", time, type);
                continue;
            }

            if (event.getDetectedAt().isBefore(classStartDateTime) || event.getDetectedAt().isAfter(classEndDateTime)) {
                continue;
            }

            if (event.getEventType() == AlertType.AWAY || event.getEventType() == AlertType.UNFOCUS) {
                if (lastLossStart == null) {
                    lastLossStart = event.getDetectedAt();
                    log.info("      🔴 비집중 시작 ({}): {}", type, time);
                }else {
                    log.info("      Pass (이미 비집중 상태): {} - {}", type, time);
                }
            } else if (event.getEventType() == AlertType.FOCUS) {
                if (lastLossStart != null) {
                    long duration = Duration.between(lastLossStart, time).getSeconds();
                    lossSeconds += duration;
                    log.info("      🟢 비집중 종료 (FOCUS): {} (누적 +{}초)", time, duration);
                    lastLossStart = null;
                } else {
                    log.info("      Pass (이미 집중 상태): {}", time);
                }
            }
        }

        if (lastLossStart != null) {
            long duration = Duration.between(lastLossStart, classEndDateTime).getSeconds();
            lossSeconds += duration;
            log.info("      🔚 수업 종료까지 미복귀: {} ~ {} (추가 +{}초)", lastLossStart, classEndDateTime, duration);
        }

        return lossSeconds;
    }
}