package com.ssafy.icethang.domain.statistics.service;

import com.ssafy.icethang.domain.statistics.dto.response.DailyStatisticsResponse;
import com.ssafy.icethang.domain.statistics.dto.response.MonthlyFocusResponse;
import com.ssafy.icethang.domain.statistics.dto.response.SubjectStatisticsResponse;
import com.ssafy.icethang.domain.statistics.dto.response.WeeklyFocusResponse;
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

    /**
     * 1. 일별 통계 조회
     */
    public List<DailyStatisticsResponse> getDailyStatistics(Long groupId, Long studentId, LocalDate date) {
        return studyLogRepository.findByStudent_ClassGroup_IdAndStudent_IdAndDateOrderByClassNoAsc(groupId, studentId, date)
                .stream()
                .map(DailyStatisticsResponse::from)
                .toList();
    }

    /**
     * 2. 주별 집중도 추이 조회 (7일간)
     */
    public List<WeeklyFocusResponse> getWeeklyFocusStats(Long groupId, Long studentId, LocalDate startDate) {
        LocalDate endDate = startDate.plusDays(6);

        // 해당 그룹+학생의 7일치 로그 조회
        List<StudyLog> logs = studyLogRepository.findByStudent_ClassGroup_IdAndStudent_IdAndDateBetweenOrderByDateAsc(groupId, studentId, startDate, endDate);

        // 날짜별 그룹화 및 평균 계산
        Map<LocalDate, Double> averageMap = logs.stream()
                .collect(Collectors.groupingBy(
                        StudyLog::getDate,
                        Collectors.averagingInt(StudyLog::getFocusRate)
                ));

        // 7일치 데이터를 순회하며 빈 날짜는 0.0 처리
        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> WeeklyFocusResponse.builder()
                        .date(date)
                        .dayOfWeek(date.getDayOfWeek().name().substring(0, 3)) // MON, TUE...
                        .averageFocusRate(Math.round(averageMap.getOrDefault(date, 0.0) * 10.0) / 10.0)
                        .build())
                .toList();
    }

    /**
     * 3. 월별 집중도 히트맵 조회
     */
    public List<MonthlyFocusResponse> getMonthlyFocusStats(Long groupId, Long studentId, YearMonth yearMonth) {
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // 한 달치 로그 조회
        List<StudyLog> logs = studyLogRepository.findByStudent_ClassGroup_IdAndStudent_IdAndDateBetweenOrderByDateAsc(groupId, studentId, startDate, endDate);

        // 날짜별로 그룹화하여 평균 집중도 계산
        Map<LocalDate, Double> averageMap = logs.stream()
                .collect(Collectors.groupingBy(
                        StudyLog::getDate,
                        Collectors.averagingInt(StudyLog::getFocusRate)
                ));

        // 결과 DTO 변환 및 정렬
        return averageMap.entrySet().stream()
                .map(entry -> MonthlyFocusResponse.builder()
                        .date(entry.getKey())
                        .averageFocusRate(Math.round(entry.getValue() * 10.0) / 10.0)
                        .build())
                .sorted(Comparator.comparing(MonthlyFocusResponse::getDate))
                .toList();
    }

    /**
     * 4. 과목별 통계 조회
     */
    public List<SubjectStatisticsResponse> getSubjectStatistics(Long groupId, Long studentId, YearMonth yearMonth) {
        // 1. 해당 월의 범위 계산
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // 2. 해당 월 + 해당 반 + 해당 학생의 로그만 조회
        List<StudyLog> logs = studyLogRepository.findByStudent_ClassGroup_IdAndStudent_IdAndDateBetweenOrderByDateAsc(groupId, studentId, startDate, endDate);

        // 3. 과목별 그룹화 (이후 집계 로직은 동일)
        Map<String, List<StudyLog>> groupedBySubject = logs.stream()
                .collect(Collectors.groupingBy(StudyLog::getSubject));

        return groupedBySubject.entrySet().stream()
                .map(entry -> {
                    String subject = entry.getKey();
                    List<StudyLog> subjectLogs = entry.getValue();

                    double avgFocus = subjectLogs.stream()
                            .mapToInt(StudyLog::getFocusRate)
                            .average().orElse(0.0);

                    double avgOut = subjectLogs.stream()
                            .mapToInt(StudyLog::getOutOfSeatCount)
                            .average().orElse(0.0);

                    return SubjectStatisticsResponse.builder()
                            .subject(subject)
                            .avgFocusRate(Math.round(avgFocus * 10.0) / 10.0)
                            .totalClassCount((long) subjectLogs.size())
                            .avgOutOfSeat(Math.round(avgOut * 10.0) / 10.0)
                            .build();
                })
                .sorted(Comparator.comparing(SubjectStatisticsResponse::getTotalClassCount).reversed())
                .toList();
    }
}