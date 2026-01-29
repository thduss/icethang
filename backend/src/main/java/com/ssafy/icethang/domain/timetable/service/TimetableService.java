package com.ssafy.icethang.domain.timetable.service;

import com.ssafy.icethang.domain.classgroup.entity.ClassGroup;
import com.ssafy.icethang.domain.classgroup.repository.ClassGroupRepository;
import com.ssafy.icethang.domain.timetable.dto.request.TimetableRequest;
import com.ssafy.icethang.domain.timetable.dto.response.TimetableResponse;
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
    private static final List<String> DAY_ORDER = List.of("MON", "TUE", "WED", "THU", "FRI");

    @Transactional
    public List<TimetableResponse> getTimetable(Long groupId, String targetDate) {
        LocalDate date = LocalDate.parse(targetDate, formatter);

        // 1. 학년도 및 학기 계산 (DB가 INT 타입이므로 Integer로 변환)
        int year = date.getYear();
        int month = date.getMonthValue();
        String ay = (month <= 2) ? String.valueOf(year - 1) : String.valueOf(year);
        Integer sem = (month >= 3 && month <= 7) ? 1 : 2;

        // 2. DB 선조회: 해당 반의 해당 학기 데이터가 있는지 확인
        List<Timetable> existingTimetables = timetableRepository.findByClassGroup_IdAndSem(groupId, sem);

        if (!existingTimetables.isEmpty()) {
            return sortByDayAndClass(existingTimetables);
        }

        // --- 데이터가 없을 경우에만 API 호출 로직 실행 ---

        // 3. 반 정보 조회
        ClassGroup group = classGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("반 정보를 찾을 수 없습니다."));

        // 4. 기존 데이터 청소 (혹시 모를 찌꺼기 제거)
        timetableRepository.deleteByClassGroup_Id(groupId);
        timetableRepository.flush();

        // 5. 날짜 범위 계산 및 API 호출
        String startDate = date.with(TemporalAdjusters.firstDayOfMonth()).format(formatter);
        String endDate = date.with(TemporalAdjusters.lastDayOfMonth()).format(formatter);

        List<Map<String, String>> rows = neisApiService.fetchTimetable(
                group.getTeacher().getSchool().getScCode(),
                group.getTeacher().getSchool().getSchoolCode(),
                group.getGrade(), group.getClassNum(),
                startDate, endDate, ay, String.valueOf(sem)
        );

        if (rows == null || rows.isEmpty()) return List.of();

        // 6. 데이터 정제 및 중복 제거
        List<Timetable> newTimetables = rows.stream()
                .map(row -> Timetable.builder()
                        .classGroup(group)
                        .dayOfWeek(convertToDayOfWeek(row.get("ALL_TI_YMD")))
                        .classNo(Integer.parseInt(row.get("PERIO")))
                        .subject(row.get("ITRT_CNTNT"))
                        .sem(sem)
                        .build())
                .filter(t -> t.getSubject() != null && !t.getSubject().trim().isEmpty())
                .filter(t -> DAY_ORDER.contains(t.getDayOfWeek())) // 주말 자동 필터링
                .distinct()
                .collect(Collectors.toList());

        // 7. DB 저장
        if (!newTimetables.isEmpty()) {
            timetableRepository.saveAllAndFlush(newTimetables);
        }

        return sortByDayAndClass(newTimetables);
    }

    // 요일 -> 교시 순 정렬 로직 공통화
    private List<TimetableResponse> sortByDayAndClass(List<Timetable> timetables) {
        return timetables.stream()
                .sorted(Comparator.comparing((Timetable t) -> DAY_ORDER.indexOf(t.getDayOfWeek()))
                        .thenComparing(Timetable::getClassNo))
                .map(TimetableResponse::from)
                .toList();
    }

    private String convertToDayOfWeek(String ymd) {
        LocalDate date = LocalDate.parse(ymd, formatter);
        return date.getDayOfWeek().name().substring(0, 3);
    }

    @Transactional
    public void updateTimetable(Long timetableId, TimetableRequest dto) {
        Timetable timetable = timetableRepository.findById(timetableId)
                .orElseThrow(() -> new RuntimeException("해당 시간표를 찾을 수 없습니다."));

        // Entity 내의 update 메서드 활용
        timetable.update(dto.getDayOfWeek(), dto.getClassNo(), dto.getSubject(), dto.getSem());
    }

    @Transactional
    public void deleteTimetable(Long timetableId) {
        if (!timetableRepository.existsById(timetableId)) {
            throw new RuntimeException("삭제할 시간표가 존재하지 않습니다.");
        }
        timetableRepository.deleteById(timetableId);
    }
}