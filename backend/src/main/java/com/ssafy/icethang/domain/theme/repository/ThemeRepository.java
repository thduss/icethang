package com.ssafy.icethang.domain.theme.repository;

import com.ssafy.icethang.domain.theme.entity.Theme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 조회용
public interface ThemeRepository extends JpaRepository<Theme, Long> {
    List<Theme> findAllByCategory(Theme.ThemeCategory category);
}
