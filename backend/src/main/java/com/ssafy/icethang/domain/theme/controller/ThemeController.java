package com.ssafy.icethang.domain.theme.controller;

import com.ssafy.icethang.domain.theme.dto.response.ThemeResponse;
import com.ssafy.icethang.domain.theme.service.ThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/themes")
@RequiredArgsConstructor
public class ThemeController {
    private final ThemeService themeService;

    // 내가 보유한 캐릭터 목록 조회
    @GetMapping("/characters/my")
    public ResponseEntity<List<ThemeResponse>> getMyCharacters(
            @RequestParam Long studentId
    ) {
        List<ThemeResponse> response = themeService.getMyCharacters(studentId);
        return ResponseEntity.ok(response);
    }

    // 전체 캐릭터 목록 조회
    @GetMapping("/characters")
    public ResponseEntity<List<ThemeResponse>> getAllCharacters(
            @RequestParam Long studentId
    ) {
        List<ThemeResponse> response = themeService.getAllCharacters(studentId);
        return ResponseEntity.ok(response);
    }

    // 전체 배경(테마) 목록 조회
    @GetMapping("/backgrounds")
    public ResponseEntity<List<ThemeResponse>> getAllBackgrounds(
    ) {
        List<ThemeResponse> response = themeService.getAllBackgrounds();
        return ResponseEntity.ok(response);
    }

    // 캐릭터 장착
    @PatchMapping("/characters/{themeId}/equip")
    public ResponseEntity<Void> equipCharacter(
            @PathVariable Long themeId,
            @RequestParam Long studentId
    ) {
        themeService.equipCharacter(studentId, themeId);
        return ResponseEntity.ok().build();
    }

    // 배경 장착
    @PatchMapping("/backgrounds/{themeId}/equip")
    public ResponseEntity<Void> equipBackground(
            @PathVariable Long themeId,
            @RequestParam Long studentId
    ) {
        themeService.equipBackground(studentId, themeId);
        return ResponseEntity.ok().build();
    }

    // 캐릭터 정해서 unlock 하기
    @PostMapping("/characters/{themeId}/unlock")
    public ResponseEntity<Void> unlockCharacter(
            @PathVariable Long themeId,
            @RequestParam Long studentId
    ) {
        themeService.unlockCharacter(studentId, themeId);
        return ResponseEntity.ok().build();
    }
}
