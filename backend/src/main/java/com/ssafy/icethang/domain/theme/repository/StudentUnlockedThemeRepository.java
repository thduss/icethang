package com.ssafy.icethang.domain.theme.repository;

import com.ssafy.icethang.domain.theme.entity.StudentUnlockedTheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentUnlockedThemeRepository extends JpaRepository<StudentUnlockedTheme, Long> {

    // 특정 학생이 보유한 모든 테마 목록 조회
    List<StudentUnlockedTheme> findByStudentId(Long studentId);
    // 특정 학생잉 보유한 테마 id들만 조회
    @Query("SELECT sut.theme.id FROM StudentUnlockedTheme sut WHERE sut.student.id = :studentId")
    List<Long> findThemeIdsByStudentId(@Param("studentId") Long studentId);

    // 특정 학생이 특정 테마 가지고 있는지 체크
    boolean existsByStudentIdAndThemeId(Long studentId, Long themeId);
}
