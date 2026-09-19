import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Dynamic namespace for ride tracking and ride chat: /rides/:rideId
  const rideNamespace = io.of(/^\/rides\/[a-zA-Z0-9_-]+$/);

  rideNamespace.use(async (socket, next) => {
    // In Phase 5: authenticate user token and verify participant status on room join
    next();
  });

  rideNamespace.on('connection', (socket) => {
    const namespaceName = socket.nsp.name;
    const rideId = namespaceName.split('/')[2];
    console.log(`Socket connected to ride namespace: ${rideId}, socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected from ride: ${rideId}`);
    });
  });

  console.log('⚡ Socket.IO initialized on HTTP server');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};
