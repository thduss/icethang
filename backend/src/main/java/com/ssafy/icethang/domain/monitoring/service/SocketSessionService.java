package com.ssafy.icethang.domain.monitoring.service;

import com.ssafy.icethang.domain.monitoring.dto.ConnectedStudentDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SocketSessionService {

    // 세션 ID로 반 ID 찾기 (퇴장 처리용)
    private final Map<String, Long> sessionClassMap = new ConcurrentHashMap<>();

    // 세션 ID로 학생 정보 찾기 (퇴장 알림용)
    private final Map<String, ConnectedStudentDto> sessionStudentMap = new ConcurrentHashMap<>();

    // 반 별 접속자 명단 (조회 API용)
    private final Map<Long, Map<String, ConnectedStudentDto>> classParticipants = new ConcurrentHashMap<>();

    /**
     * 학생 입장 처리 (메모리 저장)
     */
    public void addStudent(String sessionId, Long classId, ConnectedStudentDto studentInfo) {
        sessionClassMap.put(sessionId, classId);
        sessionStudentMap.put(sessionId, studentInfo);

        // 반 명단에 추가 (반이 없으면 새로 맵 생성)
        classParticipants.computeIfAbsent(classId, k -> new ConcurrentHashMap<>())
                .put(sessionId, studentInfo);
    }

    /**
     * 학생 퇴장 처리 (메모리 삭제) & 삭제된 학생 정보 반환
     */
    public ConnectedStudentDto removeStudent(String sessionId) {
        Long classId = sessionClassMap.remove(sessionId);
        ConnectedStudentDto student = sessionStudentMap.remove(sessionId);

        if (classId != null && student != null) {
            Map<String, ConnectedStudentDto> participants = classParticipants.get(classId);
            if (participants != null) {
                participants.remove(sessionId);
            }
            return student; // 퇴장한 학생 정보 반환
        }
        return null; // 관리되지 않던 세션(그냥 연결만 했다 끊은 경우)
    }

    /**
     * 현재 접속자 목록 조회
     */
    public List<ConnectedStudentDto> getConnectedStudents(Long classId) {
        Map<String, ConnectedStudentDto> participants = classParticipants.get(classId);
        if (participants == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(participants.values());
    }

    /**
     * 현재 접속자 수 조회
     */
    public int getClassUserCount(Long classId) {
        Map<String, ConnectedStudentDto> participants = classParticipants.get(classId);
        return (participants == null) ? 0 : participants.size();
    }

    // 세션 ID로 반 ID 조회
    public Long getClassIdBySession(String sessionId) {
        return sessionClassMap.get(sessionId);
    }
}
