package com.ssafy.icethang.domain.student.service;

import com.ssafy.icethang.domain.auth.dto.response.TokenResponseDto;
import com.ssafy.icethang.domain.auth.entity.Auth;
import com.ssafy.icethang.domain.student.dto.request.StudentJoinRequest;
import com.ssafy.icethang.domain.student.dto.request.StudentLoginRequest;
import com.ssafy.icethang.domain.student.dto.response.StudentLoginResponse;
import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import com.ssafy.icethang.domain.student.dto.response.StudyLogResponse;
import com.ssafy.icethang.domain.student.entity.Student;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import com.ssafy.icethang.domain.student.repository.StudentRepository;
import com.ssafy.icethang.domain.student.repository.StudyLogRepository;
import com.ssafy.icethang.global.redis.RedisService;
import com.ssafy.icethang.global.security.TokenProvider;
import com.ssafy.icethang.global.security.UserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {

    private final StudentRepository studentRepository;
    private final ClassGroupRepository classGroupRepository;
    private final TokenProvider tokenProvider;
    private final RedisService redisService;
    private final StudyLogRepository studyLogRepository;

    // 최초 로그인
    @Transactional
    public TokenResponseDto join(StudentJoinRequest request){
        if(studentRepository.existsByDeviceUuid(request.getDeviceUuid())){
            throw new IllegalStateException("이미 등록된 기기.");
        }
        // 초대코드로 반 찾기
        ClassGroup classGroup = classGroupRepository.findByInviteCode(request.getInviteCode())
                .orElseThrow(() -> new IllegalArgumentException("없는 초대코드 입니다."));

        Auth teacher = classGroup.getTeacher();

        if (teacher == null) {
            throw new IllegalArgumentException("해당 반의 선생님 정보가 유효하지 않습니다.");
        }

        Integer schoolId = null;
        if (teacher.getSchool() != null) {
            schoolId = teacher.getSchool().getSchoolId();
        } else {
            // 선생님이 학교 정보 없이 가입된 경우
            throw new IllegalStateException("선생님의 학교 정보가 설정되지 않았습니다.");
        }

        Student student = Student.builder()
                .name(request.getName())
                .deviceUuid(request.getDeviceUuid())
                .classGroup(classGroup)
                .studentNumber(request.getStudentNumber())
                .schoolId(schoolId)
                .build();

        studentRepository.save(student);

        return createStudentToken(student);
    }

    // 기기번호로 자동 로그인
    public TokenResponseDto autoLogin(StudentLoginRequest request) {
        // 기기로 학생 찾기
        Student student = studentRepository.findByDeviceUuid(request.getDeviceUuid())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 기기입니다."));

        ClassGroup classGroup = student.getClassGroup();
        if (classGroup == null) {
            throw new IllegalStateException("소속된 반이 없습니다.");
        }

        return createStudentToken(student);
    }

    // 토큰 생성 및 Redis 저장
    private TokenResponseDto createStudentToken(Student student) {

        UserPrincipal studentPrincipal = new UserPrincipal(
                student.getId(),
                student.getDeviceUuid(),
                "",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                studentPrincipal, // 위에서 principal 처리한 student 객체를 전달
                "",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );

        String accessToken = tokenProvider.createToken(authentication);
        String refreshToken = tokenProvider.createRefreshToken(authentication);

        // Redis
        redisService.setValues(
                student.getDeviceUuid(),
                refreshToken,
                Duration.ofDays(7)
        );

        return TokenResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    // 토큰으로 학생 정보 조회
    public StudentLoginResponse getStudentInfo(String accessToken) {
        Authentication authentication = tokenProvider.getAuthentication(accessToken);
        String deviceUuid = authentication.getName();

        Student student = studentRepository.findByDeviceUuid(deviceUuid)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 토큰(학생)입니다."));

        return StudentLoginResponse.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .classId(student.getClassGroup().getId())
                .grade(student.getClassGroup().getGrade())
                .classNum(student.getClassGroup().getClassNum())
                .studentNumber(student.getStudentNumber())
                .accessToken(accessToken)
                .build();
    }

    public List<StudyLogResponse> getStudentStudyLogs(Long studentId) {

        // 학생 조회
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("해당 학생을 찾을 수 없습니다."));

        return studyLogRepository.findAllByStudentOrderByCreatedAtDesc(student)
                .stream()
                .map(StudyLogResponse::from)
                .collect(Collectors.toList());
    }

    //--------------------------------------------
    // 소켓

    // 속도 -> 비동기 처리 고민
}
