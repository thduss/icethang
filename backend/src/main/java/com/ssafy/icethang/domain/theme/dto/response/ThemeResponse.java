package com.ssafy.icethang.domain.theme.dto.response;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ThemeResponse {
    private Long themeId;
    private String name;
    private String assetUrl;
    private String category;
    private boolean isUnlocked; // 보유 여부 체크
    private boolean isEquipped; // 장착 여부 체크
}
