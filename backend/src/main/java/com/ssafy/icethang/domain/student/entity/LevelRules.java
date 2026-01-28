package com.ssafy.icethang.domain.student.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE level_rules SET deleted_at = CURRENT_TIMESTAMP WHERE level = ?")
@Where(clause = "deleted_at IS NULL")
@AllArgsConstructor
@Table(name = "level_rules")
public class LevelRules {

    @Id
    @Column(name = "level")
    private Integer level;

    @Column(name = "required_xp", nullable = false)
    private int requiredXp;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    public LevelRules(Integer level, int requiredXp) {
        this.level = level;
        this.requiredXp = requiredXp;
    }
}