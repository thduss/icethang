package com.ssafy.icethang.domain.classgroup.service;

import com.ssafy.icethang.domain.classgroup.dto.request.ClassCreateRequest;
import com.ssafy.icethang.domain.classgroup.dto.request.ClassUpdateRequest;
import com.ssafy.icethang.domain.classgroup.dto.response.ClassResponse;
import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassGroupService {

    private final ClassGroupRepository classGroupRepository;

    // 반 생성
    @Transactional
    public Long createClass(ClassCreateRequest request, Long teacherId) {
        String inviteCode;

        // 초대코드 중복 안 나올 때까지 돌리기 (보통 한 번에 통과됨)
        do {
            inviteCode = UUID.randomUUID().toString().substring(0, 8); // 8자리 랜덤 코드
        } while (classGroupRepository.existsByInviteCode(inviteCode));

        // 저장
        ClassGroup classGroup = ClassGroup.builder()
                .teacherId(teacherId)
                .groupName(request.getGroupName())
                .inviteCode(inviteCode)
                .allowDigitalMode(true) // 기본값 설정
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
                .orElseThrow(() -> new IllegalArgumentException("해당 반이 존재하지 않습니다."));
        return ClassResponse.from(classGroup);
    }

    // 반 수정(반 이름만)
    @Transactional
    public void updateClass(Long classId, ClassUpdateRequest request, Long teacherId) {
        ClassGroup classGroup = classGroupRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("해당 반이 존재하지 않습니다."));

        if (!classGroup.getTeacherId().equals(teacherId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        classGroup.updateGroupName(request.getGroupName());
    }

    // 반 삭제
    @Transactional
    public void deleteClass(Long classId, Long teacherId) {
        ClassGroup classGroup = classGroupRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("해당 반이 존재하지 않습니다."));

        if (!classGroup.getTeacherId().equals(teacherId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }
        classGroupRepository.deleteById(classId);
    }
}