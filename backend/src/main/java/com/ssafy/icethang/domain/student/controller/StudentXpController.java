package com.ssafy.icethang.domain.student.controller;

import com.ssafy.icethang.domain.student.dto.request.StudentXpUpdateRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentXpResponse;
import com.ssafy.icethang.domain.student.service.StudentXpService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/classes")
@RequiredArgsConstructor
public class StudentXpController {
    private final StudentXpService studentXpService;

    // 학생 경험치랑 레벨 조회
    @GetMapping("/{classId}/students/{studentId}/xp")
    public ResponseEntity<StudentXpResponse> getXp(
            @PathVariable("classId") Long classId,
            @PathVariable("studentId") Long studentId) {
        return ResponseEntity.ok(studentXpService.getStudentXp(classId, studentId));
    }

    // 학생 경험치를 선생님이 임의로 수정
    @PatchMapping("/{classId}/students/{studentId}/xp/give")
    // 시큐리티 설정 확인
    public ResponseEntity<StudentXpResponse> giveXp(
            @PathVariable("classId") Long classId,
            @PathVariable("studentId") Long studentId,
            @RequestBody StudentXpUpdateRequest request) {
        StudentXpResponse response = studentXpService.updateStudentExp(classId, studentId, request);
        return ResponseEntity.ok(response);
    }
}
