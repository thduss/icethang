package com.ssafy.icethang.domain.timetable.controller;

import com.ssafy.icethang.domain.timetable.dto.response.TimetableDto;
import com.ssafy.icethang.domain.timetable.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/classes/{groupId}/schedules")
public class TimetableController {

    private final TimetableService timetableService;

    @GetMapping
    public ResponseEntity<List<TimetableDto>> getTimetable(
            @PathVariable Long groupId,
            @RequestParam String targetDate
    ) {
        return ResponseEntity.ok(timetableService.getTimetable(groupId, targetDate));
    }
}
