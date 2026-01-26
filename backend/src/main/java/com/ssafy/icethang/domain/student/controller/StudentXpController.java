package com.ssafy.icethang.domain.student.controller;

import com.ssafy.icethang.domain.student.dto.request.StudentXpUpdateRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentXpResponse;
import com.ssafy.icethang.domain.student.service.StudentXpService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
public class StudentXpController {
    private final StudentXpService studentXpService;

    // 학생 경험치랑 레벨 조회
    @GetMapping("/{student_id}/xp")
    public ResponseEntity<StudentXpResponse> getXp(@PathVariable("student_id") Long studentId) {
        return ResponseEntity.ok(studentXpService.getStudentXp(studentId));
    }

    // 학생 경험치를 선생님이 임의로 수정
    @PatchMapping("/{student_id}/xp/give")
    // 시큐리티 설정 확인
    public ResponseEntity<String> giveXp(
            @PathVariable("student_id") Long studentId,
            @RequestBody StudentXpUpdateRequest request) {
        studentXpService.updateStudentExp(studentId, request.getAmount());
        return ResponseEntity.ok("경험치가 성공적으로 수정되었습니다.");
    }
}
