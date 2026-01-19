import { Slot } from "expo-router";
import "../global.css"; 

export default function RootLayout() {
  return <Slot screenOptions={{
        headerShown: false, // 헤더 사용 X
      }}></Slot>;
}