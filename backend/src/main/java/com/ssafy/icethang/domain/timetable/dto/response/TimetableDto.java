package com.ssafy.icethang.domain.timetable.dto.response;

import com.ssafy.icethang.domain.timetable.entity.Timetable;

// 프론트 반환용
public record TimetableDto(
        String dayOfWeek,
        Integer classNo,
        String subject
) {
    public static TimetableDto from(Timetable entity) {
        return new TimetableDto(
                entity.getDayOfWeek(),
                entity.getClassNo(),
                entity.getSubject()
        );
    }
}