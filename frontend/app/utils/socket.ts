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

export const stompClient = new Client({
  webSocketFactory: () => new WebSocket(SOCKET_URL),

  reconnectDelay: 5000,
  forceBinaryWSFrames: true,
  appendMissingNULLonIncoming: true,

  debug: (str) => {
    console.log('[Socket Debug]:', str);
  },

  onConnect: () => {
    console.log('✅ 소켓 연결 성공!');
  },
  onStompError: (frame) => {
    console.error('🚨 소켓 에러:', frame.headers['message']);
    console.error('Details:', frame.body);
  },
});

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
      destination: `/app/mode`, 
      body: JSON.stringify({ classId, mode }),
    });
  }
};