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
    public StudentXpResponse getStudentXp(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("학생을 찾을 수 없습니다."));

        // 다음 레벨 정보 조회
        Integer nextLevelExp = levelRulesRepository.findById(student.getLevel() + 1)
                .map(LevelRules::getRequiredXp)
                .orElse(null); // 만렙인 경우 null

        return new StudentXpResponse(student.getId(), student.getLevel(), student.getExp(), nextLevelExp);
    }

    // 선생님이 경험치 임의 수정
    @Transactional
    public void updateStudentExp(Long studentId, Integer amount) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("학생을 찾을 수 없습니다."));

        student.updateXp(amount);

        // 새로운 경험치에 맞는 레벨 계산
        Integer newLevel = levelRulesRepository.findTopByRequiredXpLessThanEqualOrderByLevelDesc(student.getExp())
                .map(LevelRules::getLevel)
                .orElse(1);

        student.updateLevel(newLevel);
    }
}
