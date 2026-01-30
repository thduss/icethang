package com.ssafy.icethang.domain.timetable.controller;

import com.ssafy.icethang.domain.timetable.dto.request.TimetableRequest;
import com.ssafy.icethang.domain.timetable.dto.response.TimetableResponse;
import com.ssafy.icethang.domain.timetable.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/classes/{groupId}/schedules")
public class TimetableController {

    private final TimetableService timetableService;

    // 1. 조회
    @GetMapping
    public ResponseEntity<List<TimetableResponse>> getTimetable(
            @PathVariable Long groupId,
            @RequestParam String targetDate
    ) {
        return ResponseEntity.ok(timetableService.getTimetable(groupId, targetDate));
    }

    // 2. 수정
    @PutMapping("/{timetableId}")
    public ResponseEntity<Void> updateTimetable(
            @PathVariable Long timetableId,
            @RequestBody TimetableRequest requestDto
    ) {
        timetableService.updateTimetable(timetableId, requestDto);
        return ResponseEntity.ok().build();
    }

    // 3. 삭제
    @DeleteMapping("/{timetableId}")
    public ResponseEntity<Void> deleteTimetable(
            @PathVariable Long timetableId
    ) {
        timetableService.deleteTimetable(timetableId);
        return ResponseEntity.noContent().build();
    }

    // 4. 추가
    @PostMapping
    public ResponseEntity<Void> createTimetable(
            @PathVariable Long groupId,
            @RequestBody TimetableRequest requestDto
    ) {
        timetableService.createTimetable(groupId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
