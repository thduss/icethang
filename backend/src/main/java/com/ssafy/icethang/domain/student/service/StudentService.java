package com.ssafy.icethang.domain.student.service;

import com.ssafy.icethang.domain.student.dto.request.StudentJoinRequest;
import com.ssafy.icethang.domain.student.dto.request.StudentLoginRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentLoginResponse;
import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;
    private final ClassGroupRepository classGroupRepository;

    @Transactional
    // 최초 로그인
    public StudentLoginResponse join(StudentJoinRequest request){
        if(studentRepository.existsByDeviceUuid(request.getDeviceUuid())){
            throw new IllegalStateException("이미 등록된 기기.");
        }
        ClassGroup classGroup = classGroupRepository.findByInviteCode(request.getInviteCode())
                .orElseThrow(() -> new IllegalArgumentException("없는 초대코드 입니다."));

        Student student = Student.builder()
                .name(request.getName())
                .deviceUuid(request.getDeviceUuid())
                .classGroup(classGroup)
                .studentNumber(request.getStudentNumber())
                .build();

        studentRepository.save(student);

        return StudentLoginResponse.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .classId(classGroup.getId())
                .className(classGroup.getGroupName())
                .studentNumber(student.getStudentNumber())
                .build();
    }

    // 기기번호로 자동 로그인
    public StudentLoginResponse autoLogin(StudentLoginRequest request) {
        // 기기로 학생 찾기
        Student student = studentRepository.findByDeviceUuid(request.getDeviceUuid())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 기기입니다."));

        ClassGroup classGroup = student.getClassGroup();
        if (classGroup == null) {
            throw new IllegalStateException("소속된 반이 없습니다.");
        }

        return StudentLoginResponse.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .classId(classGroup.getId())
                .className(classGroup.getGroupName())
                .studentNumber(student.getStudentNumber())
                .build();
    }
}
