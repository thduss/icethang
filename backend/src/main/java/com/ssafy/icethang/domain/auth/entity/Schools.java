package com.ssafy.icethang.domain.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "schools", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"sc_code", "school_code"})
})
@Builder
@AllArgsConstructor
public class Schools {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "school_id")
    private Integer schoolId;

    @Column(name = "sc_code", length = 20, nullable = false)
    private String scCode;

    @Column(name = "school_code", length = 20, nullable = false)
    private String schoolCode;

    @Column(name = "school_name", nullable = false)
    private String schoolName;

    @Builder
    public Schools(String scCode, String schoolCode, String schoolName) {
        this.scCode = scCode;
        this.schoolCode = schoolCode;
        this.schoolName = schoolName;
    }
}