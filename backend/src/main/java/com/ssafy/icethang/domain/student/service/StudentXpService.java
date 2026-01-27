package com.ssafy.icethang.domain.student.service;

import com.ssafy.icethang.domain.student.dto.request.StudentXpUpdateRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentXpResponse;
import com.ssafy.icethang.domain.student.entity.LevelRules;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import com.ssafy.icethang.domain.student.repository.LevelRulesRepository;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.domain.student.repository.StudyLogRepository;
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

    // 학생 경험치 및 레벨 조회
    @Transactional(readOnly = true)
    public StudentXpResponse getStudentXp(Long classId, Long studentId) {
        Student student = validateStudentInClass(classId, studentId);
        return convertToResponse(student);
    }

    // 선생님이 경험치 임의 수정
    @Transactional
    public StudentXpResponse updateStudentExp(Long classId, Long studentId, StudentXpUpdateRequest request) {
        Student student = validateStudentInClass(classId, studentId);

        student.updateXp(request.getAmount());

        // 새로운 경험치에 맞는 레벨 계산
        Integer newLevel = levelRulesRepository.findTopByRequiredXpLessThanEqualOrderByLevelDesc(student.getCurrentXp())
                .map(LevelRules::getLevel)
                .orElse(1);
        student.updateLevel(newLevel);

        // 학습 로그
        String finalReason = StringUtils.hasText(request.getReason())
                ? request.getReason()
                : DEFAULT_TEACHER_REASON;

        StudyLog log = StudyLog.builder()
                .student(student)
                .subject(null)      // timetable 만들면 연결시키기
                .earnedXp(request.getAmount())
                .classNo(0)         // 수정 필요
                .reason(finalReason)
                .timetableId(null)
                .build();

        studyLogRepository.save(log);

        return convertToResponse(student);
    }

    // 학생이 classId에 맞는 학생인지 검증
    private Student validateStudentInClass(Long classId, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("학생을 찾을 수 없습니다. ID: " + studentId));

        if (student.getClassGroup() == null || !student.getClassGroup().getId().equals(classId)) {
            throw new RuntimeException("해당 반(ID: " + classId + ") 소속 학생이 아닙니다.");
        }
        return student;
    }


    private StudentXpResponse convertToResponse(Student student) {
        Integer nextLevelExp = levelRulesRepository.findById(student.getCurrentLevel() + 1)
                .map(LevelRules::getRequiredXp)
                .orElse(null);

        return StudentXpResponse.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .currentLevel(student.getCurrentLevel())
                .currentXp(student.getCurrentXp())
                .requiredExpNextLevel(nextLevelExp)
                .build();
    }
}
