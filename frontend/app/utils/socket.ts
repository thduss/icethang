import { Client } from '@stomp/stompjs';
import { TextEncoder, TextDecoder } from 'text-encoding';

// ⚠️ [필수] React Native 호환성 패치 (이거 없으면 brokerURL 써도 에러 납니다)
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

// .env에서 주소 가져오기
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL; 

export const stompClient = new Client({
  // 1. brokerURL 대신 webSocketFactory 사용 권장 (RN에서 더 안정적)
  //    WebSocket을 직접 생성해서 리턴해줍니다.
  webSocketFactory: () => new WebSocket(SOCKET_URL),
  
  // 2. 기타 설정
  reconnectDelay: 5000,
  forceBinaryWSFrames: true,
  appendMissingNULLonIncoming: true,
  
  // 3. 디버깅 로그 (연결 잘 되는지 확인용)
  debug: (str) => {
    console.log('[Socket Debug]:', str);
  },
  
  // 4. 연결 성공 시 실행될 콜백 (선택 사항)
  onConnect: () => {
    console.log('✅ 소켓 연결 성공!');
  },
  onStompError: (frame) => {
    console.error('🚨 소켓 에러:', frame.headers['message']);
    console.error('Details:', frame.body);
  },
});

// 기존 연결/해제 함수들은 그대로 유지...
export const connectSocket = (token: string) => {
  if (stompClient.active) return;
  stompClient.connectHeaders = { Authorization: `Bearer ${token}` };
  stompClient.activate();
};

export const disconnectSocket = () => {
  if (stompClient.active) stompClient.deactivate();
};

export const changeClassMode = (classId: number, mode: 'NORMAL' | 'DIGITAL') => {
  if (stompClient.connected) {
    stompClient.publish({
      destination: `/app/class/mode`, 
      body: JSON.stringify({ classId, mode }),
    });
  }
};