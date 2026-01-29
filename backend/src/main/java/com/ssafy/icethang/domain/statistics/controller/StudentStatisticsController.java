package com.ssafy.icethang.domain.statistics.controller;

import com.ssafy.icethang.domain.statistics.dto.response.DailyStatisticsResponse;
import com.ssafy.icethang.domain.statistics.service.StudentStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/students/{studentId}/statistics")
public class StudentStatisticsController {

    private final StudentStatisticsService studentStatisticsService;

    @GetMapping("/daily")
    public ResponseEntity<List<DailyStatisticsResponse>> getDailyStatistics(
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(pattern = "yyyyMMdd") LocalDate date
    ) {
        return ResponseEntity.ok(studentStatisticsService.getDailyStatistics(studentId, date));
    }
}