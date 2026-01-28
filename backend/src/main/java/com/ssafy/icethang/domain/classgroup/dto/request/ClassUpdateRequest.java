package com.ssafy.icethang.domain.classgroup.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ClassUpdateRequest {
    private Integer grade;
    private Integer classNum;
}
