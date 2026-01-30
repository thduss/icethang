package com.ssafy.icethang.domain.monitoring.controller;

import com.ssafy.icethang.domain.classgroup.dto.request.ClassSessionEndRequest;
import com.ssafy.icethang.domain.monitoring.service.ClassSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/classes")
@RequiredArgsConstructor
public class ClassSessionController {

    private final ClassSessionService classSessionService;

    // 수업 시작
    @PostMapping("/{classId}/session/start")
    public ResponseEntity<String> startClass(@PathVariable Long classId) {
        classSessionService.startClass(classId);
        return ResponseEntity.ok("수업 시작 처리가 완료되었습니다.");
    }

    // 수업 종료 및 정산 (데이터 포함)
    @PatchMapping("/{classId}/session/end")
    public ResponseEntity<String> endClass(
            @PathVariable Long classId,
            @RequestBody ClassSessionEndRequest request) {

        classSessionService.endClass(classId, request);
        return ResponseEntity.ok("수업 종료 및 리포트 생성이 완료되었습니다.");
    }
}
