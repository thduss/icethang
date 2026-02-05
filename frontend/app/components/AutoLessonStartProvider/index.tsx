import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

import StudyStartModal from "../StudyStartModal";
import { RootState, AppDispatch } from "../../store/stores";
import { fetchSchedules } from "../../store/slices/scheduleSlice";
import { ScheduleDto } from "../../services/scheduleService";

/** 교시 시작 시간 */
const PERIOD_START_TIME: Record<number, string> = {
  1: "09:00",
  2: "09:50",
  3: "10:40",
  4: "11:30",
  5: "13:20",
  6: "14:10",
};

interface Props {
  children: React.ReactNode;
}

export default function AutoLessonStartProvider({ children }: Props) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const selectedClassId = useSelector(
    (state: RootState) => state.class.selectedClassId
  );

  const scheduleData = useSelector(
    (state: RootState) => state.schedule.items
  );

  const [showModal, setShowModal] = useState(false);
  const [currentLesson, setCurrentLesson] =
    useState<ScheduleDto | null>(null);

  const shownLessons = useRef<Set<number>>(new Set());


  useEffect(() => {
    if (!selectedClassId) return;

    const targetDate = "20251029"; // TODO: 오늘 날짜로 변경

    dispatch(
      fetchSchedules({
        groupId: selectedClassId,
        targetDate,
      })
    );
  }, [selectedClassId, dispatch]);


  useEffect(() => {
    if (!scheduleData || scheduleData.length === 0) return;

    const checkLessonStart = () => {
      const now = new Date();
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const today = days[now.getDay()];

      scheduleData
        .filter(item => item.dayOfWeek === today)
        .forEach(item => {
          const startTime = PERIOD_START_TIME[item.classNo];
          if (!startTime) return;

          const [h, m] = startTime.split(":").map(Number);
          const lessonTime = new Date();
          lessonTime.setHours(h, m, 0, 0);

          const diff = Math.abs(now.getTime() - lessonTime.getTime());

          if (
            diff < 60_000 &&
            !shownLessons.current.has(item.timetableId)
          ) {
            shownLessons.current.add(item.timetableId);
            setCurrentLesson(item);
            setShowModal(true);
          }
        });
    };

    checkLessonStart();
    const timer = setInterval(checkLessonStart, 30_000);

    return () => clearInterval(timer);
  }, [scheduleData]);

  return (
    <View style={{ flex: 1 }}>
      {children}

      {currentLesson && (
        <StudyStartModal
          visible={showModal}
          subject={currentLesson.subject}
          period={currentLesson.classNo}
          onCancel={() => setShowModal(false)}
          onConfirm={() => {
            setShowModal(false);
            router.push("/screens/Teacher_Lesson");
          }}
        />
      )}
    </View>
  );
}
