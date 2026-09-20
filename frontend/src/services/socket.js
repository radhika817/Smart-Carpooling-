import { io } from 'socket.io-client';

const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/^["']|["']$/g, '');

export const SOCKET_URL = rawEnvUrl
  ? rawEnvUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  : 'http://localhost:5000';

/**
 * Creates an authorized Socket.IO connection to a specific ride's namespace: /rides/:rideId
 *
 * @param {string} rideId - The unique ID of the ride
 * @returns {Socket} Connected Socket.IO client instance
 */
export const connectRideSocket = (rideId) => {
  const token = localStorage.getItem('smartride_token') || localStorage.getItem('token');

  const socket = io(`${SOCKET_URL}/rides/${rideId}`, {
    auth: {
      token: token ? `Bearer ${token}` : '',
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log(`[Socket Connected] Connected to ride namespace /rides/${rideId} on ${SOCKET_URL}`);
  });

  socket.on('connect_error', (err) => {
    console.warn(`[Socket Error] Connection failed: ${err.message}`);
  });

  return socket;
};
