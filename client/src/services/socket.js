import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected with ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });
  }
  return socket;
};
