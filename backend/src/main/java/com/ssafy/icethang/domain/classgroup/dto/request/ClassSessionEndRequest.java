package com.ssafy.icethang.domain.classgroup.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
public class ClassSessionEndRequest {
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
}
