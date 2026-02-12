import { Client } from '@stomp/stompjs';
import { TextEncoder, TextDecoder } from 'text-encoding';

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

// .env에서 주소 가져오기
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL; 

console.log('[Socket] SOCKET_URL:', SOCKET_URL);

export const stompClient = new Client({
  webSocketFactory: () => {
    console.log('[Socket] WebSocket 생성 시도:', SOCKET_URL);
    const ws = new WebSocket(SOCKET_URL);
    ws.onopen = () => console.log('[Socket] WebSocket onopen 발생');
    ws.onerror = (e) => console.error('[Socket] WebSocket onerror:', e);
    ws.onclose = (e) => console.log('[Socket] WebSocket onclose:', e.code, e.reason);
    return ws;
  },

  reconnectDelay: 5000,
  forceBinaryWSFrames: true,
  appendMissingNULLonIncoming: true,

  debug: (str) => {
    console.log('[Socket Debug]:', str);
  },

  onConnect: (frame) => {
    console.log('[Socket] STOMP 연결 성공! connected:', stompClient.connected, 'active:', stompClient.active);
    console.log('[Socket] CONNECTED frame:', frame?.headers);
  },
  onDisconnect: () => {
    console.log('[Socket] STOMP 연결 해제됨');
  },
  onWebSocketClose: (evt) => {
    console.log('[Socket] WebSocket 닫힘:', evt);
  },
  onWebSocketError: (evt) => {
    console.error('[Socket] WebSocket 에러:', evt);
  },
  onStompError: (frame) => {
    console.error('[Socket] STOMP 에러:', frame.headers['message']);
    console.error('[Socket] STOMP 에러 상세:', frame.body);
  },
});

export const connectSocket = (token: string) => {
  console.log('[Socket] connectSocket 호출 - active:', stompClient.active, 'connected:', stompClient.connected);
  // 항상 헤더 갱신
  stompClient.connectHeaders = { Authorization: `Bearer ${token}` };

  if (stompClient.connected) {
    console.log('[Socket] connectSocket: 이미 connected 상태, 스킵');
    return;
  }

  if (stompClient.active) {
    // active이지만 connected가 아닌 경우 (cleanup 레이스 컨디션)
    console.log('[Socket] connectSocket: active이지만 미연결 -> deactivate 후 재연결');
    stompClient.deactivate().then(() => {
      stompClient.connectHeaders = { Authorization: `Bearer ${token}` };
      console.log('[Socket] connectSocket: deactivate 완료 -> activate() 호출');
      stompClient.activate();
    });
    return;
  }

  console.log('[Socket] connectSocket: activate() 호출');
  stompClient.activate();
};

export const disconnectSocket = () => {
  console.log('[Socket] disconnectSocket 호출 - active:', stompClient.active);
  if (stompClient.active) stompClient.deactivate();
};

export const changeClassMode = (classId: number, mode: 'NORMAL' | 'DIGITAL') => {
  console.log('[Socket] changeClassMode 호출 - classId:', classId, 'mode:', mode, 'connected:', stompClient.connected);
  if (stompClient.connected) {
    const payload = { classId, mode };
    console.log('[Socket] PUBLISH /app/mode:', JSON.stringify(payload));
    stompClient.publish({
      destination: `/app/mode`,
      body: JSON.stringify(payload),
    });
  } else {
    console.warn('[Socket] changeClassMode: 소켓 미연결! 메시지 전송 실패');
  }
};

export const enterClass = (classId: number, studentId: number, studentName: string) => {
  console.log('[Socket] enterClass 호출 - classId:', classId, 'studentId:', studentId, 'connected:', stompClient.connected);
  if (stompClient.connected) {
    const payload = { classId, studentId, studentName };
    console.log('[Socket] PUBLISH /app/enter:', JSON.stringify(payload));
    stompClient.publish({
      destination: '/app/enter',
      body: JSON.stringify(payload),
    });
  } else {
    console.warn('[Socket] enterClass: 소켓 미연결! 메시지 전송 실패');
  }
};

// 화장실/발표 등 학생 요청 알림을 topic에 직접 전송 (백엔드 /app/alert 우회)
export const sendStudentRequest = (
  classId: number,
  studentId: number,
  studentName: string,
  type: 'RESTROOM' | 'ACTIVITY' | 'FOCUS'
) => {
  if (stompClient.connected) {
    console.log(`[Socket] StudentRequest 직접 전송: ${type} -> /topic/class/${classId}`);
    stompClient.publish({
      destination: `/topic/class/${classId}`,
      body: JSON.stringify({
        classId,
        studentId,
        studentName,
        type,
      }),
    });
  } else {
    console.warn(`[Socket] StudentRequest 전송 실패 (미연결): ${type}`);
  }
};

export const sendAlert = (
  classId: number,
  studentId: number,
  studentName: string,
  type: 'FOCUS' | 'UNFOCUS' | 'AWAY' | 'RESTROOM' | 'ACTIVITY',
  detectedAt?: string
) => {
  if (stompClient.connected) {
    if (!detectedAt) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      detectedAt = new Date(now.getTime() - offset).toISOString().slice(0, -1);
    }
    console.log(`📤 [Socket] Alert 전송: ${type} (${detectedAt})`);

    stompClient.publish({
      destination: '/app/alert',
      body: JSON.stringify({
        classId,
        studentId,
        studentName,
        type,
        detectedAt
      }),
    });
  } else {
    console.warn(`⚠️ [Socket] Alert 전송 실패 (미연결): ${type}`);
  }
};