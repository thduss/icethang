const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const SOCKET_URL = BASE_URL + '/ws';

export const SOCKET_CONFIG = {
  BROKER_URL: SOCKET_URL,

  PUBLISH: {
    ALERT: "/app/alert",
    ENTER: "/app/enter", 
    REQUEST_COUNT: "/app/class/count",
  },

  SUBSCRIBE: {
    CLASS_TOPIC: (classId: string) => `/topic/class/${classId}`, 
    MODE_STATUS: (classId: string) => `/topic/class/${classId}/mode`, 
    STUDENT_COUNT: (classId: string) => `/topic/class/${classId}/count`,  
  },

  RECONNECT_DELAY: 5000,
  HEARTBEAT: 4000,
};