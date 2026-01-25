package com.ssafy.icethang.domain.classgroup.repository;

import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, Long>{

    // 선생님이 만든 반 조회
    List<ClassGroup> findAllByTeacherId(Long teacherId);

    // 학생이 반 찾기
    Optional<ClassGroup> findByInviteCode(String inviteCode);

    // 중복체크
    boolean existsByInviteCode(String inviteCode);
}
