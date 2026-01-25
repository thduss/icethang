package com.ssafy.icethang.domain.student.controller;

import com.ssafy.icethang.domain.student.dto.request.StudentJoinRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentLoginResponse;
import com.ssafy.icethang.domain.student.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
    private final StudentService studentService;

    // 학생 최초 가입
    @PostMapping("/join")
    public ResponseEntity<StudentLoginResponse> join(@RequestBody StudentJoinRequest request) {
        return ResponseEntity.ok(studentService.join(request));
    }
}
