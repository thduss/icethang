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

    // 전체 테마 조회

    // 내가 보유한 테마 목록 조회
    @GetMapping("/characters/my")
    public ResponseEntity<List<ThemeResponse>> getMyCharacters(
            @RequestParam Long studentId
    ) {
        List<ThemeResponse> response = themeService.getMyCharacters(studentId);
        return ResponseEntity.ok(response);
    }

    // 전체 배경(테마) 목록 조회
    @GetMapping("/backgrounds")
    public ResponseEntity<List<ThemeResponse>> getAllBackgrounds(
            @RequestParam Long studentId
    ) {
        List<ThemeResponse> response = themeService.getAllBackgrounds(studentId);
        return ResponseEntity.ok(response);
    }

    // 테마 unlock처리

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
}
