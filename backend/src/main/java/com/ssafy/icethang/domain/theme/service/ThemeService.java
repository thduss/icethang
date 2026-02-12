package com.ssafy.icethang.domain.theme.service;

import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.domain.theme.dto.response.ThemeResponse;
import com.ssafy.icethang.domain.theme.entity.StudentUnlockedTheme;
import com.ssafy.icethang.domain.theme.entity.Theme;
import com.ssafy.icethang.domain.theme.repository.StudentUnlockedThemeRepository;
import com.ssafy.icethang.domain.theme.repository.ThemeRepository;
import com.ssafy.icethang.global.exception.BadRequestException;
import com.ssafy.icethang.global.exception.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("학생 없음"));

        // 테이블에서 해당 학생의 보유 목록 조회
        return unlockedThemeRepository.findByStudentId(studentId).stream()
                .filter(unlocked -> unlocked.getTheme().getCategory() == Theme.ThemeCategory.CHARACTER)
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
    public List<ThemeResponse> getAllBackgrounds() {
        // Theme 테이블에서 카테고리가 BACKGROUND인 것만 싹 긁어옴
        return themeRepository.findAllByCategory(Theme.ThemeCategory.BACKGROUND).stream()
                .map(theme -> new ThemeResponse(
                        theme.getId(),
                        theme.getName(),
                        theme.getAssetUrl(),
                        theme.getCategory().name(),
                        true, // 배경은 전부 보유(사용가능) 처리
                        false // studentId 비교 안하고 모든 배경 불러오기이므로 일단 모두 false 처리
                ))
                .collect(Collectors.toList());
    }

    // 캐릭터 장착
    @Transactional
    public void equipCharacter(Long studentId, Long themeId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("학생 없음"));

        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new ResourceNotFoundException("아이템 없음"));

        // 카테고리가 캐릭터가 맞는지
        if (theme.getCategory() != Theme.ThemeCategory.CHARACTER) {
            throw new BadRequestException("캐릭터 아이템이 아닙니다.");
        }

        // 보유하고 있는지 (StudentUnlockedTheme 테이블 조회)
        if (!unlockedThemeRepository.existsByStudentIdAndThemeId(studentId, themeId)) {
            throw new BadRequestException("보유하지 않은 캐릭터입니다.");
        }

        student.equipCharacter(theme);
    }

    // 배경 장착(카테고리만 체크)
    @Transactional
    public void equipBackground(Long studentId, Long themeId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("학생 없음"));

        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new ResourceNotFoundException("아이템 없음"));

        // 카테고리가 배경이 맞는지
        if (theme.getCategory() != Theme.ThemeCategory.BACKGROUND) {
            throw new BadRequestException("배경 아이템이 아닙니다.");
        }

        student.equipBackground(theme);
    }

    // 전체 캐릭터 목록 조회
    public List<ThemeResponse> getAllCharacters(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생 없음"));

        // 모든 캐릭터 리스트 가져오기
        List<Theme> allCharacters = themeRepository.findAllByCategory(Theme.ThemeCategory.CHARACTER);

        // 내가 보유한 캐릭터인지 확인하기 위해 보유 목록 조회
        List<Long> unlockedThemeIds = unlockedThemeRepository.findByStudentId(studentId).stream()
                .map(unlocked -> unlocked.getTheme().getId())
                .collect(Collectors.toList());

        // 매핑 (전체 돌면서 isOwned 체크)
        return allCharacters.stream()
                .map(theme -> new ThemeResponse(
                        theme.getId(),
                        theme.getName(),
                        theme.getAssetUrl(),
                        theme.getCategory().name(),
                        unlockedThemeIds.contains(theme.getId()), // 보유 여부 (List에 있으면 true)
                        isEquipped(student, theme)                // 장착 여부
                ))
                .collect(Collectors.toList());
    }

    // 캐릭터 Unlock (획득 처리)
    @Transactional
    public void unlockCharacter(Long studentId, Long themeId) {
        // 이미 가지고 있는지 체크 (중복 저장 방지)
        if (unlockedThemeRepository.existsByStudentIdAndThemeId(studentId, themeId)) {
            return;
        }

        Student student = studentRepository.getReferenceById(studentId);
        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new ResourceNotFoundException("아이템 없음"));

        // 캐릭터인지 검증 (배경은 Unlock 개념 없으므로 막음)
        if (theme.getCategory() != Theme.ThemeCategory.CHARACTER) {
            throw new BadRequestException("캐릭터만 해제금지할 수 있습니다.");
        }

        StudentUnlockedTheme newUnlock = StudentUnlockedTheme.builder()
                .student(student)
                .theme(theme)
                .build();

        unlockedThemeRepository.save(newUnlock);
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
