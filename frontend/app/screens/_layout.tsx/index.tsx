import { Slot } from "expo-router";
import AutoLessonStartProvider from "../../components/AutoLessonStartProvider";

export default function ScreensLayout() {
  return (
    <AutoLessonStartProvider>
      <Slot />
    </AutoLessonStartProvider>
  );
}
