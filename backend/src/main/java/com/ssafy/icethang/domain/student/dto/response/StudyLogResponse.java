package com.ssafy.icethang.domain.student.dto.response;

import com.ssafy.icethang.domain.student.entity.StudyLog;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
public class StudyLogResponse {
    private Long logId;
    private LocalDate date;
    private String subject;
    private Integer classNo;
    private Integer focusRate;
    private String reason;
    private LocalTime startTime;
    private LocalTime endTime;

    public static StudyLogResponse from(StudyLog log) {
        return StudyLogResponse.builder()
                .logId(log.getId())
                .date(log.getDate())
                .subject(log.getSubject())
                .classNo(log.getClassNo())
                .focusRate(log.getFocusRate())
                .reason(log.getReason())
                .startTime(log.getStartTime())
                .endTime(log.getEndTime())
                .build();
    }
}
