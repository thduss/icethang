package com.ssafy.icethang.domain.theme.service;

import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.domain.theme.dto.response.ThemeResponse;
import com.ssafy.icethang.domain.theme.entity.Theme;
import com.ssafy.icethang.domain.theme.repository.StudentUnlockedThemeRepository;
import com.ssafy.icethang.domain.theme.repository.ThemeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ThemeService {
    private final ThemeRepository themeRepository;
    private final StudentRepository studentRepository;
    private final StudentUnlockedThemeRepository unlockedThemeRepository;

    // 보유한 캐릭터 조회
    public List<ThemeResponse> getMyCharacters(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생 없음"));

        // StudentUnlockedTheme 테이블에서 해당 학생의 보유 목록 조회
        return unlockedThemeRepository.findByStudentId(studentId).stream()
                .filter(unlocked -> unlocked.getTheme().getCategory() == Theme.ThemeCategory.CHARACTER) // 혹시 모를 방어 코드
                .map(unlocked -> {
                    Theme theme = unlocked.getTheme();
                    return new ThemeResponse(
                            theme.getId(),
                            theme.getName(),
                            theme.getAssetUrl(),
                            theme.getCategory().name(),
                            true, // 보유함
                            isEquipped(student, theme)
                    );
                })
                .collect(Collectors.toList());
    }

    // 배경 전체 조회
    public List<ThemeResponse> getAllBackgrounds(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생 없음"));

        // Theme 테이블에서 카테고리가 BACKGROUND인 것만 싹 긁어옴
        return themeRepository.findAllByCategory(Theme.ThemeCategory.BACKGROUND).stream()
                .map(theme -> new ThemeResponse(
                        theme.getId(),
                        theme.getName(),
                        theme.getAssetUrl(),
                        theme.getCategory().name(),
                        true, // 배경은 전부 보유(사용가능) 처리
                        isEquipped(student, theme)
                ))
                .collect(Collectors.toList());
    }

    // 캐릭터 장착
    @Transactional
    public void equipCharacter(Long studentId, Long themeId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생 없음"));

        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new IllegalArgumentException("아이템 없음"));

        // 검증 1: 카테고리가 캐릭터가 맞는지
        if (theme.getCategory() != Theme.ThemeCategory.CHARACTER) {
            throw new IllegalArgumentException("캐릭터 아이템이 아닙니다.");
        }

        // 검증 2: 보유하고 있는지 (StudentUnlockedTheme 테이블 조회)
        if (!unlockedThemeRepository.existsByStudentIdAndThemeId(studentId, themeId)) {
            throw new IllegalStateException("보유하지 않은 캐릭터입니다.");
        }

        student.equipCharacter(theme);
    }

    // 배경 장착 (보유 체크 불필요 + 카테고리 체크)
    @Transactional
    public void equipBackground(Long studentId, Long themeId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생 없음"));

        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new IllegalArgumentException("아이템 없음"));

        // 검증: 카테고리가 배경이 맞는지
        if (theme.getCategory() != Theme.ThemeCategory.BACKGROUND) {
            throw new IllegalArgumentException("배경 아이템이 아닙니다.");
        }

        // 배경은 보유 여부 체크 없이 바로 장착
        student.equipBackground(theme);
    }

    // 장착 여부 확인
    private boolean isEquipped(Student student, Theme theme) {
        if (theme.getCategory() == Theme.ThemeCategory.CHARACTER) {
            return student.getEquippedCharacter() != null &&
                    student.getEquippedCharacter().getId().equals(theme.getId());
        } else {
            return student.getEquippedBackground() != null &&
                    student.getEquippedBackground().getId().equals(theme.getId());
        }
    }
}
