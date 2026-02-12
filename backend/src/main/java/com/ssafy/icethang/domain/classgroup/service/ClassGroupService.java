package com.ssafy.icethang.domain.classgroup.service;

import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.auth.repository.AuthRepository;
import com.ssafy.icethang.domain.classgroup.dto.request.ClassCreateRequest;
import com.ssafy.icethang.domain.classgroup.dto.request.ClassUpdateRequest;
import com.ssafy.icethang.domain.classgroup.dto.response.ClassResponse;
import com.ssafy.icethang.domain.classgroup.dto.response.ClassStudentResponse;
import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import com.ssafy.icethang.domain.student.dto.request.StudentUpdateRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentDetailResponse;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.global.exception.BadRequestException;
import com.ssafy.icethang.global.exception.ForbiddenException;
import com.ssafy.icethang.global.exception.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassGroupService {

    private final ClassGroupRepository classGroupRepository;
    private final StudentRepository studentRepository;
    private final AuthRepository teacherRepository;

    private final Random random = new Random();

    // 반 생성
    @Transactional
    public Long createClass(ClassCreateRequest request, Long teacherId) {
        String inviteCode;
        Auth teacher = teacherRepository.getReferenceById(teacherId);

        // 초대코드 중복 안 나올 때까지 돌리기
        do {
            // 영어 대문자 1개 + 숫자 4자리 생성 (예 A1234)
            char letter = (char) ('A' + random.nextInt(26));
            int number = random.nextInt(10000);

            inviteCode = String.format("%c%04d", letter, number);
        } while (classGroupRepository.existsByInviteCode(inviteCode));

        // 저장
        ClassGroup classGroup = ClassGroup.builder()
                .teacher(teacher)
                .grade(request.getGrade())
                .classNum(request.getClassNum())
                .inviteCode(inviteCode)
                .allowDigitalMode(true)
                .allowNormalMode(true)
                .allowThemeChange(false)
                .build();

        return classGroupRepository.save(classGroup).getId();
    }

    // 반 목록 조회
    public List<ClassResponse> getMyClassList(Long teacherId) {
        return classGroupRepository.findAllByTeacherId(teacherId).stream()
                .map(ClassResponse::from)
                .collect(Collectors.toList());
    }

    // 반 상세 조회
    public ClassResponse getClassDetail(Long classId) {
        ClassGroup classGroup = classGroupRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 반이 존재하지 않습니다."));
        return ClassResponse.from(classGroup);
    }

    // 반 학생 목록 조회
    public List<ClassStudentResponse> getClassStudents(Long classId) {
        if (!classGroupRepository.existsById(classId)) {
            throw new ResourceNotFoundException("존재하지 않는 반입니다.");
        }

        return studentRepository.findAllByClassGroupId(classId).stream()
                .map(ClassStudentResponse::from)
                .collect(Collectors.toList());
    }

    // 반 수정(반 이름만)
    @Transactional
    public void updateClass(Long classId, ClassUpdateRequest request, Long teacherId) {
        ClassGroup classGroup = classGroupRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 반이 존재하지 않습니다."));

        if (!classGroup.getTeacher().getId().equals(teacherId)) {
            throw new ForbiddenException("수정 권한이 없습니다.");
        }

        classGroup.updateClassInfo(request.getGrade(), request.getClassNum());
    }

    // 반 삭제
    @Transactional
    public void deleteClass(Long classId, Long teacherId) {
        ClassGroup classGroup = classGroupRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 반이 존재하지 않습니다."));

        if (!classGroup.getTeacher().getId().equals(teacherId)) {
            throw new ForbiddenException("삭제 권한이 없습니다.");
        }

        // 해당 반에 속한 학생들도 모두 찾아서 삭제(soft delete)
        List<Student> students = studentRepository.findAllByClassGroupId(classId);
        studentRepository.deleteAll(students);

        classGroupRepository.delete(classGroup);
    }

    //---------------------------------------------------------------------------
    // 특정 반 속 학생 관리

    // 학생 상세 조회
    public StudentDetailResponse getStudentDetail(Long classId, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 학생이 존재하지 않습니다."));

        if (!student.getClassGroup().getId().equals(classId)) {
            throw new BadRequestException("해당 반의 해당 학생이 존재하지 않습니다.");
        }

        return StudentDetailResponse.from(student);
    }

    // 학생 정보 수정
    @Transactional
    public void updateStudent(Long classId, Long studentId, StudentUpdateRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 학생이 존재하지 않습니다."));

        if (!student.getClassGroup().getId().equals(classId)) {
            throw new BadRequestException("해당 반의 학생이 아닙니다.");
        }

        student.updateInfo(request.getName(), request.getStudentNumber());
    }

    // 학생 삭제
    @Transactional
    public void deleteStudent(Long classId, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 학생이 존재하지 않습니다."));

        if (!student.getClassGroup().getId().equals(classId)) {
            throw new BadRequestException("해당 반의 학생이 아닙니다.");
        }

        studentRepository.delete(student);
    }
}