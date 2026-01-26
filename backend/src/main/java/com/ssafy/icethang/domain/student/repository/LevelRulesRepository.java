package com.ssafy.icethang.domain.student.repository;

import com.ssafy.icethang.domain.student.entity.LevelRules;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LevelRulesRepository extends JpaRepository<LevelRules, Integer> {
    // 특정 경험치 이하에서 가장 큰 레벨을 찾는 쿼리
    Optional<LevelRules> findTopByRequiredXpLessThanEqualOrderByLevelDesc(Integer exp);
}
