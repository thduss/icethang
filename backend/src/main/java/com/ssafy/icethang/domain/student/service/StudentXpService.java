package com.ssafy.icethang.domain.student.service;

import com.ssafy.icethang.domain.student.dto.request.StudentXpUpdateRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentXpResponse;
import com.ssafy.icethang.domain.student.entity.LevelRules;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import com.ssafy.icethang.domain.student.repository.LevelRulesRepository;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.domain.student.repository.StudyLogRepository;
import com.ssafy.icethang.global.exception.BadRequestException;
import com.ssafy.icethang.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class StudentXpService {
    private final StudentRepository studentRepository;
    private final LevelRulesRepository levelRulesRepository;
    private final StudyLogRepository studyLogRepository;

    // default 문장 수정 가능
    private static final String DEFAULT_TEACHER_REASON = "수업 good";
    private static final String DEFAULT_SUBJECT_LABEL = "추가";

    // 학생 경험치 및 레벨 조회
    @Transactional(readOnly = true)
    public StudentXpResponse getStudentXp(Long classId, Long studentId) {
        Student student = validateStudentInClass(classId, studentId);

        String lastReason = studyLogRepository.findTopByStudentOrderByCreatedAtDesc(student)
                .map(StudyLog::getReason)
                .orElse("기록된 사유가 없습니다.");

        return buildResponse(student, lastReason);
    }

    // 선생님이 경험치 추가 부여
    @Transactional
    public StudentXpResponse updateStudentExp(Long classId, Long studentId, StudentXpUpdateRequest request) {
        Student student = validateStudentInClass(classId, studentId);

        // 학습로그
        String finalReason = StringUtils.hasText(request.getReason())
                ? request.getReason()
                : DEFAULT_TEACHER_REASON;

        // 과목 결정
        String finalSubject = DEFAULT_SUBJECT_LABEL;

        // 교시 결정
        Integer finalClassNo = 0;

        // student의 currentXp 즉시 변경
        student.addXp(request.getAmount());

        // 새로운 경험치에 맞는 레벨 계산
        Integer newLevel = levelRulesRepository.findTopByRequiredXpLessThanEqualOrderByLevelDesc(student.getCurrentXp())
                .map(LevelRules::getLevel)
                .orElse(1);
        student.updateLevel(newLevel);

        StudyLog log = StudyLog.builder()
                .student(student)
                .subject(finalSubject)
                .classNo(finalClassNo)
                .reason(finalReason)
                .timetableId(null)
                .focusRate(request.getAmount()) // 추가 경험치를 focusRate에 저장
                .build();

        studyLogRepository.save(log);

        return buildResponse(student, finalReason);
    }

    // 학생이 classId에 맞는 학생인지 검증
    private Student validateStudentInClass(Long classId, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("학생을 찾을 수 없습니다. ID: " + studentId));

        if (student.getClassGroup() == null || !student.getClassGroup().getId().equals(classId)) {
            throw new BadRequestException("해당 반(ID: " + classId + ") 소속 학생이 아닙니다.");
        }
        return student;
    }


    private StudentXpResponse buildResponse(Student student, String reason) {
        return StudentXpResponse.builder()
                .currentLevel(student.getCurrentLevel())
                .currentXp(student.getCurrentXp())
                .reason(reason)
                .build();
    }
}
