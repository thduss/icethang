package com.ssafy.icethang.domain.statistics.controller;

import com.ssafy.icethang.domain.statistics.dto.response.DailyStatisticsResponse;
import com.ssafy.icethang.domain.statistics.dto.response.MonthlyFocusResponse;
import com.ssafy.icethang.domain.statistics.dto.response.SubjectStatisticsResponse;
import com.ssafy.icethang.domain.statistics.dto.response.WeeklyFocusResponse;
import com.ssafy.icethang.domain.statistics.service.StudentStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/classes/{groupId}/students/{studentId}/statistics")
public class StudentStatisticsController {

    private final StudentStatisticsService studentStatisticsService;

    @GetMapping("/daily")
    public ResponseEntity<List<DailyStatisticsResponse>> getDailyStatistics(
            @PathVariable Long groupId,
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(pattern = "yyyyMMdd") LocalDate date
    ) {
        return ResponseEntity.ok(studentStatisticsService.getDailyStatistics(groupId, studentId, date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeeklyFocusResponse>> getWeeklyStats(
            @PathVariable Long groupId,
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(pattern = "yyyyMMdd") LocalDate startDate
    ) {
        return ResponseEntity.ok(studentStatisticsService.getWeeklyFocusStats(groupId, studentId, startDate));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlyFocusResponse>> getMonthlyStats(
            @PathVariable Long groupId,
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month
    ) {
        return ResponseEntity.ok(studentStatisticsService.getMonthlyFocusStats(groupId, studentId, month));
    }

    // 4. 과목별 통계 (특정 월 기준 필터링)
    @GetMapping("/subjects") // s를 붙여서 복수형으로 쓰는 게 관례입니다!
    public ResponseEntity<List<SubjectStatisticsResponse>> getSubjectStats(
            @PathVariable Long groupId,
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth month
    ) {
        // 리턴 타입과 서비스 메서드 호출을 수정했습니다.
        return ResponseEntity.ok(studentStatisticsService.getSubjectStatistics(groupId, studentId, month));
    }
}