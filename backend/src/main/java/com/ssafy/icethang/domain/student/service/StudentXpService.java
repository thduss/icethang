package com.ssafy.icethang.domain.student.service;

import com.ssafy.icethang.domain.student.dto.response.StudentXpResponse;
import com.ssafy.icethang.domain.student.entity.LevelRules;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.repository.LevelRulesRepository;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentXpService {
    private final StudentRepository studentRepository;
    private final LevelRulesRepository levelRulesRepository;

    // 학생 경험치 및 레벨 조회
    @Transactional(readOnly = true)
    public StudentXpResponse getStudentXp(Long classId, Long studentId) {
        Student student = validateStudentInClass(classId, studentId);

        return convertToResponse(student);
    }

    // 선생님이 경험치 임의 수정
    @Transactional
    public StudentXpResponse updateStudentExp(Long classId, Long studentId, Integer amount) {
        Student student = validateStudentInClass(classId, studentId);

        student.updateXp(amount);

        // 새로운 경험치에 맞는 레벨 계산
        Integer newLevel = levelRulesRepository.findTopByRequiredXpLessThanEqualOrderByLevelDesc(student.getCurrentXp())
                .map(LevelRules::getLevel)
                .orElse(1);
        student.updateLevel(newLevel);

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
