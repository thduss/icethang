package com.ssafy.icethang.domain.timetable.dto.response;

import com.ssafy.icethang.domain.timetable.entity.Timetable;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TimetableResponse {
    private Long timetableId;
    private String dayOfWeek;
    private Integer classNo;
    private String subject;
    private Integer sem;

    public static TimetableResponse from(Timetable timetable) {
        return TimetableResponse.builder()
                .timetableId(timetable.getTimetableId())
                .dayOfWeek(timetable.getDayOfWeek())
                .classNo(timetable.getClassNo())
                .subject(timetable.getSubject())
                .sem(timetable.getSem())
                .build();
    }
}