package com.ssafy.icethang.domain.timetable.repository;

import com.ssafy.icethang.domain.timetable.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByClassGroup_Id(Long groupId);
    void deleteByClassGroup_Id(Long groupId);
    List<Timetable> findByClassGroup_IdAndSem(Long groupId, Integer sem);
}