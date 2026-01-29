package com.ssafy.icethang.domain.statistics.dto.response;

import com.ssafy.icethang.domain.student.entity.StudyLog;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DailyStatisticsResponse {
    private Integer classNo;      // 교시
    private String subject;       // 과목
    private Integer focusRate;    // 집중도
    private Integer outOfSeatCount; // 이탈 횟수

    public static DailyStatisticsResponse from(StudyLog studyLog) {
        return DailyStatisticsResponse.builder()
                .classNo(studyLog.getClassNo())
                .subject(studyLog.getSubject())
                .focusRate(studyLog.getFocusRate())
                .outOfSeatCount(studyLog.getOutofseatCount())
                .build();
    }
}