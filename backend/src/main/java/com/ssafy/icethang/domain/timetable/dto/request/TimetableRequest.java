package com.ssafy.icethang.domain.timetable.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TimetableRequest {
    private String dayOfWeek; // MON, TUE...
    private Integer classNo;   // 1, 2...
    private String subject;    // 과목명
    private Integer sem;       // 학기
}
