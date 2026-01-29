package com.ssafy.icethang.domain.statistics.service;

import com.ssafy.icethang.domain.statistics.dto.response.DailyStatisticsResponse;
import com.ssafy.icethang.domain.statistics.dto.response.MonthlyFocusResponse;
import com.ssafy.icethang.domain.student.entity.StudyLog;
import com.ssafy.icethang.domain.student.repository.StudyLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentStatisticsService {

    private final StudyLogRepository studyLogRepository;

    public List<DailyStatisticsResponse> getDailyStatistics(Long studentId, LocalDate date) {
        return studyLogRepository.findByStudent_IdAndDateOrderByClassNoAsc(studentId, date)
                .stream()
                .map(DailyStatisticsResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonthlyFocusResponse> getMonthlyFocusStats(Long studentId, YearMonth yearMonth) {
        // 1. 해당 월의 시작일과 종료일 계산
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // 2. 한 달치 로그 조회
        List<StudyLog> logs = studyLogRepository.findByStudent_IdAndDateBetweenOrderByDateAsc(studentId, startDate, endDate);

        // 3. 날짜별로 그룹화하여 평균 집중도 계산
        // SQL: SELECT date, AVG(focus_rate) FROM study_logs GROUP BY date
        Map<LocalDate, Double> averageMap = logs.stream()
                .collect(Collectors.groupingBy(
                        StudyLog::getDate,
                        Collectors.averagingInt(StudyLog::getFocusRate)
                ));

        // 4. 결과 DTO 변환 및 정렬
        return averageMap.entrySet().stream()
                .map(entry -> MonthlyFocusResponse.builder()
                        .date(entry.getKey())
                        .averageFocusRate(Math.round(entry.getValue() * 10.0) / 10.0)
                        .build())
                .sorted(Comparator.comparing(MonthlyFocusResponse::getDate))
                .toList();
    }
}