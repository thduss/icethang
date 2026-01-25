package com.ssafy.icethang.domain.student.repository;


import com.ssafy.icethang.domain.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByDeviceUuid(String deviceUuid);

    // 기기번호 중복 체크
    boolean existsByDeviceUuid(String deviceUuid);

    // 반 id로 학생 목록 찾기 위함
    List<Student> findAllByClassGroupId(Long classGroupId);
}
