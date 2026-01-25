package com.ssafy.icethang.domain.classgroup.controller;

import com.ssafy.icethang.domain.classgroup.dto.request.ClassCreateRequest;
import com.ssafy.icethang.domain.classgroup.dto.request.ClassUpdateRequest;
import com.ssafy.icethang.domain.classgroup.dto.response.ClassResponse;
import com.ssafy.icethang.domain.classgroup.service.ClassGroupService;
import com.ssafy.icethang.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/classes")
public class ClassGroupController {
    private final ClassGroupService classGroupService;

    // 반 생성
    @PostMapping
    public ResponseEntity<Long> createClass(
            @RequestBody ClassCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long classId = classGroupService.createClass(request, principal.getId());
        return ResponseEntity.ok(classId);
    }

    // 내 반 목록 조회
    @GetMapping
    public ResponseEntity<List<ClassResponse>> getMyClasses(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(classGroupService.getMyClassList(principal.getId()));
    }

    // 반 상세 조회
    @GetMapping("/{classId}")
    public ResponseEntity<ClassResponse> getClassDetail(@PathVariable Long classId) {
        return ResponseEntity.ok(classGroupService.getClassDetail(classId));
    }

    // 반 정보 수정
    @PatchMapping("/{classId}")
    public ResponseEntity<Void> updateClass(
            @PathVariable Long classId,
            @RequestBody ClassUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        classGroupService.updateClass(classId, request, principal.getId());
        return ResponseEntity.ok().build();
    }

    // 반 삭제
    @DeleteMapping("/{classId}")
    public ResponseEntity<Void> deleteClass(@PathVariable Long classId, @AuthenticationPrincipal UserPrincipal principal) {
        classGroupService.deleteClass(classId, principal.getId());
        return ResponseEntity.ok().build();
    }
}
