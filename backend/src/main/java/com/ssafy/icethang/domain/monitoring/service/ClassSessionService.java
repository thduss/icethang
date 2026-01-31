package com.ssafy.icethang.domain.monitoring.service;

import com.ssafy.icethang.domain.classgroup.dto.request.ClassSessionEndRequest;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import com.ssafy.icethang.domain.monitoring.dto.AlertType;
import com.ssafy.icethang.domain.monitoring.entity.ClassEventLog;
import com.ssafy.icethang.domain.monitoring.repository.ClassEventLogRepository;
import com.ssafy.icethang.domain.student.dto.response.StudyLogResponse;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public List<StudyLogResponse> endClass(Long classId, ClassSessionEndRequest request) {
        log.info("========== [수업 종료 정산 시작] ==========");
        log.info("요청 정보: 날짜={}, 시간={} ~ {}", request.getDate(), request.getStartTime(), request.getEndTime());

        // 해당 반 전체 조회
        List<Student> students = studentRepository.findAllByClassGroupId(classId);
        if (students.isEmpty()) return Collections.emptyList();

        List<ClassEventLog> allEvents = classEventLogRepository.findAllByStudentInAndStudyLogIsNullOrderByDetectedAtAsc(students);

        // 이벤트들을 학생별로 그룹핑
        Map<Student, List<ClassEventLog>> eventsByStudent = allEvents.stream()
                .collect(Collectors.groupingBy(ClassEventLog::getStudent));

        List<StudyLog> studyLogsToSave = new ArrayList<>();

        // 학생별 계산
        long totalSeconds = Math.max(1, Duration.between(request.getStartTime(), request.getEndTime()).getSeconds());

        for (Student student : students) {

            // 맵에서 지금 학생것만 꺼내옴
            List<ClassEventLog> myEvents = eventsByStudent.getOrDefault(student, new ArrayList<>());

            // 수업에 집중하지 않은 총 시간 계산
            long lossSeconds = calculateLossTime(myEvents, request);

            // 집중도 공식
            int focusRate = (int) (((double)(totalSeconds - lossSeconds) / totalSeconds) * 100);
            focusRate = Math.max(0, Math.min(100, focusRate));

            // 자리이탈 횟수 계산
            int awayCount = (int) myEvents.stream().filter(e -> e.getEventType() == AlertType.AWAY).count();

            // StudyLog 객체 생성
            StudyLog studyLog = StudyLog.builder()
                    .student(student)
                    .date(request.getDate())
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .subject(request.getSubject())
                    .classNo(request.getClassNo())
                    .focusRate(focusRate)
                    .outofseatCount(awayCount)
                    .build();

            studyLogsToSave.add(studyLog);
        }
        // 성적표 일괄 저장
        studyLogRepository.saveAll(studyLogsToSave);

        List<StudyLog> savedLogs = studyLogRepository.saveAll(studyLogsToSave);

        // saveAll을 하면 studylog 객체들에 id가 생김 -> 그걸로 연결
        for (StudyLog savedLog : studyLogsToSave) {
            List<ClassEventLog> connectedEvents = eventsByStudent.get(savedLog.getStudent());
            if (connectedEvents != null) {
                for (ClassEventLog event : connectedEvents) {
                    event.updateStudyLog(savedLog);
                }
            }
        }
        log.info("========== [수업 종료 정산 완료] ==========");

        return savedLogs.stream()
                .map(StudyLogResponse::from)
                .collect(Collectors.toList());
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