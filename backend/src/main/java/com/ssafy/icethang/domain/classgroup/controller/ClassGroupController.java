package com.ssafy.icethang.domain.classgroup.controller;

import com.ssafy.icethang.domain.classgroup.dto.request.ClassCreateRequest;
import com.ssafy.icethang.domain.classgroup.dto.request.ClassUpdateRequest;
import com.ssafy.icethang.domain.classgroup.dto.response.ClassResponse;
import com.ssafy.icethang.domain.classgroup.dto.response.ClassStudentResponse;
import com.ssafy.icethang.domain.classgroup.service.ClassGroupService;
import com.ssafy.icethang.domain.student.dto.request.StudentUpdateRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentDetailResponse;
import com.ssafy.icethang.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/classes")
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
    public ResponseEntity<ClassResponse> getClassDetail(
            @PathVariable Long classId) {
        return ResponseEntity.ok(classGroupService.getClassDetail(classId));
    }

    // 반 안에 학생 목록 보기
    @GetMapping("/{classId}/students")
    public ResponseEntity<List<ClassStudentResponse>> getClassStudents(
            @PathVariable Long classId
    ) {
        return ResponseEntity.ok(classGroupService.getClassStudents(classId));
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
    public ResponseEntity<Void> deleteClass(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserPrincipal principal) {
        classGroupService.deleteClass(classId, principal.getId());
        return ResponseEntity.ok().build();
    }

    //-----------------------------------------------------

    // 학생 상세 조회
    @GetMapping("/{classId}/students/{studentId}")
    public ResponseEntity<StudentDetailResponse> getStudentDetail(
            @PathVariable Long classId,
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(classGroupService.getStudentDetail(classId, studentId));
    }

    // 학생 정보 수정
    @PatchMapping("/{classId}/students/{studentId}")
    public ResponseEntity<Void> updateStudent(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            @RequestBody StudentUpdateRequest request
    ) {
        classGroupService.updateStudent(classId, studentId, request);
        return ResponseEntity.ok().build();
    }

    // 학생 삭제
    @DeleteMapping("/{classId}/students/{studentId}")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long classId,
            @PathVariable Long studentId
    ) {
        classGroupService.deleteStudent(classId, studentId);
        return ResponseEntity.ok().build();
    }
}
