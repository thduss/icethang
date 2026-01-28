package com.ssafy.icethang.domain.theme.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "themes")
@Getter
@NoArgsConstructor
// soft delete고민
// baseentity 가져올지말지 고민필요
public class Theme {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "theme_id")
    private Long id;

    @Column(name = "theme_name", nullable = false)
    private String name;

    @Column(name = "asset_url")
    private String assetUrl;

    @Column(name = "asset_type")
    private String assetType; // "png", "gif"

    @Enumerated(EnumType.STRING)
    @Column(name = "theme_category")
    private ThemeCategory category;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 카테고리 Enum
    public enum ThemeCategory {
        CHARACTER, BACKGROUND
    }
}
