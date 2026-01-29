package com.ssafy.icethang.domain.timetable.service;

import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import com.ssafy.icethang.domain.timetable.dto.response.TimetableDto;
import com.ssafy.icethang.domain.timetable.entity.Timetable;
import com.ssafy.icethang.domain.timetable.repository.TimetableRepository;
import com.ssafy.icethang.global.utill.NeisApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimetableService {

    private final TimetableRepository timetableRepository;
    private final ClassGroupRepository classGroupRepository;
    private final NeisApiService neisApiService;

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Transactional
    public List<TimetableDto> getTimetable(Long groupId, String targetDate) {
        // 1. 해당 월의 시작일(1일)과 종료일(말일) 계산
        LocalDate date = LocalDate.parse(targetDate, formatter);
        String startDate = date.with(TemporalAdjusters.firstDayOfMonth()).format(formatter);
        String endDate = date.with(TemporalAdjusters.lastDayOfMonth()).format(formatter);

        // 2. 반 정보 조회
        ClassGroup group = classGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("반 정보를 찾을 수 없습니다."));

        // 3. 기존 데이터 삭제
        timetableRepository.deleteByClassGroup_Id(groupId);
        timetableRepository.flush();

        // 4. 학년도/학기 계산 (나이스 기준)
        int year = date.getYear();
        int month = date.getMonthValue();
        String ay = (month <= 2) ? String.valueOf(year - 1) : String.valueOf(year);
        String sem = (month >= 3 && month <= 7) ? "1" : "2";

        // 5. 나이스 API 호출 (한 달 치)
        List<Map<String, String>> rows = neisApiService.fetchTimetable(
                group.getTeacher().getSchool().getScCode(),
                group.getTeacher().getSchool().getSchoolCode(),
                group.getGrade(), group.getClassNum(),
                startDate, endDate, ay, sem
        );

        if (rows == null || rows.isEmpty()) return List.of();

        // 6. 데이터 정제 (null 과목 버리기 + 주말 제거 + 중복 제거)
        List<Timetable> newTimetables = rows.stream()
                .map(row -> Timetable.builder()
                        .classGroup(group)
                        .dayOfWeek(convertToDayOfWeek(row.get("ALL_TI_YMD")))
                        .classNo(Integer.parseInt(row.get("PERIO")))
                        .subject(row.get("ITRT_CNTNT"))
                        .sem(Integer.parseInt(sem))
                        .build())
                .filter(t -> t.getSubject() != null && !t.getSubject().trim().isEmpty())
                .filter(t -> !t.getDayOfWeek().equals("SAT") && !t.getDayOfWeek().equals("SUN"))
                .distinct()
                .collect(Collectors.toList());

        // 7. DB 저장
        if (!newTimetables.isEmpty()) {
            timetableRepository.saveAllAndFlush(newTimetables);
        }

        // 8. 정렬 반환 (요일순 -> 교시순)
        List<String> dayOrder = List.of("MON", "TUE", "WED", "THU", "FRI");
        return newTimetables.stream()
                .sorted(Comparator.comparing((Timetable t) -> dayOrder.indexOf(t.getDayOfWeek()))
                        .thenComparing(Timetable::getClassNo))
                .map(TimetableDto::from)
                .toList();
    }

    private String convertToDayOfWeek(String ymd) {
        LocalDate date = LocalDate.parse(ymd, formatter);
        return date.getDayOfWeek().name().substring(0, 3);
    }
}