package com.ssafy.icethang.domain.statistics.service;

import com.ssafy.icethang.domain.statistics.dto.response.DailyStatisticsResponse;
import com.ssafy.icethang.domain.student.repository.StudyLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

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
}