package com.ssafy.icethang.domain.auth.repository;

import com.ssafy.icethang.domain.auth.entity.Schools;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchoolsRepository extends JpaRepository<Schools, Integer> {
    Optional<Schools> findBySchoolName(String schoolName);
}
