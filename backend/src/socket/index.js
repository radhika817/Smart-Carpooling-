import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { verifyParticipant, saveMessage } from '../services/chat/chatService.js';
import { haversineDistanceKm } from '../services/matching/matchingService.js';

let io = null;

// In-memory cache of live driver locations per ride (for instant client sync upon connection)
const activeRideLocations = new Map();

export const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Dynamic regex namespace for ride tracking and ride chat: /rides/:rideId
  const rideNamespace = io.of(/^\/rides\/[a-zA-Z0-9_-]+$/);

  // Authentication & Authorization Middleware
  rideNamespace.use(async (socket, next) => {
    try {
      const namespaceName = socket.nsp.name;
      const rideId = namespaceName.split('/')[2];

      if (!rideId) {
        return next(new Error('Invalid ride namespace'));
      }

      // Extract token from handshake auth, query, or headers
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
      const userId = decoded.id || decoded.userId || decoded._id;

      const user = await User.findById(userId).select('name email role');
      if (!user) {
        return next(new Error('User not found'));
      }

      // Verify that connecting user is an active participant in this ride
      const { isParticipant, role, ride } = await verifyParticipant(rideId, userId);
      if (!isParticipant) {
        return next(new Error('Forbidden: You are not an active participant of this ride'));
      }

      // Attach session context to socket
      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.userRole = role; // 'driver' or 'passenger'
      socket.rideId = rideId;
      socket.rideDestination = ride.destination?.coordinates;

      next();
    } catch (err) {
      console.warn(`[Socket Auth Failed]: ${err.message}`);
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  // Client Connection Handler
  rideNamespace.on('connection', (socket) => {
    const { rideId, userName, userRole } = socket;
    console.log(`[Socket Connected] Ride: ${rideId} | User: ${userName} (${userRole}) | Socket: ${socket.id}`);

    // If driver's live location is already in memory, immediately sync to the newly joined client
    if (activeRideLocations.has(rideId)) {
      socket.emit('location:broadcast', activeRideLocations.get(rideId));
    }

    // 1. Live Driver Location Broadcasting
    socket.on('location:update', (data = {}) => {
      // Security: Only the assigned driver can broadcast location updates
      if (socket.userRole !== 'driver') {
        socket.emit('error', { message: 'Only the driver can broadcast vehicle location.' });
        return;
      }

      const { coordinates, heading = 0, speed = 0 } = data;
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        return;
      }

      // Calculate distance remaining to ride destination
      let distanceRemainingKm = 0;
      let etaMinutes = 1;
      if (socket.rideDestination && socket.rideDestination.length === 2) {
        distanceRemainingKm = haversineDistanceKm(coordinates, socket.rideDestination);
        // Estimate city transit ETA: ~2 minutes per kilometer (average 30 km/h)
        etaMinutes = Math.max(1, Math.round(distanceRemainingKm * 2));
      }

      const locationPayload = {
        rideId,
        coordinates,
        heading: Number(heading) || 0,
        speed: Number(speed) || 0,
        distanceRemainingKm,
        etaMinutes,
        timestamp: Date.now(),
      };

      // Cache in memory for new joiners
      activeRideLocations.set(rideId, locationPayload);

      // Broadcast to all participants in this ride's namespace
      socket.nsp.emit('location:broadcast', locationPayload);
    });

    // 2. In-Ride Chat Messaging
    socket.on('chat:message', async (data = {}) => {
      try {
        const { text } = data;
        if (!text || !text.trim()) return;

        // Persist message to database
        const savedMessage = await saveMessage({
          rideId,
          senderId: socket.userId,
          senderName: socket.userName,
          senderRole: socket.userRole,
          text,
        });

        // Broadcast message to all participants in this ride
        socket.nsp.emit('chat:message', {
          _id: savedMessage._id,
          ride: rideId,
          sender: socket.userId,
          senderName: socket.userName,
          senderRole: socket.userRole,
          text: savedMessage.text,
          createdAt: savedMessage.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: err.message || 'Failed to send chat message' });
      }
    });

    // 3. Driver Ride Status Transition
    socket.on('ride:status:update', (data = {}) => {
      if (socket.userRole !== 'driver') {
        socket.emit('error', { message: 'Only the driver can change ride status.' });
        return;
      }

      const { status, message } = data;
      if (!status) return;

      socket.nsp.emit('ride:status', {
        rideId,
        status,
        message: message || `Ride status updated to ${status}`,
        timestamp: Date.now(),
      });
    });

    // 4. Emergency SOS Trigger
    socket.on('sos:trigger', async (data = {}) => {
      try {
        const { coordinates, address } = data;
        const { triggerSos } = await import('../services/safety/safetyService.js');
        const result = await triggerSos({
          rideId,
          userId: socket.userId,
          coordinates,
          address,
        });
        socket.emit('sos:confirmed', result);
      } catch (err) {
        socket.emit('error', { message: err.message || 'Failed to trigger SOS alert' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] Ride: ${rideId} | Socket: ${socket.id}`);
    });
  });

  console.log('⚡ Socket.IO initialized on HTTP server');
  return io;
};

/**
 * Helper to broadcast an event from REST controllers to a specific ride's Socket.IO namespace
 */
export const broadcastToRide = (rideId, event, data) => {
  if (!io) return;
  const nsp = io.of(`/rides/${rideId}`);
  nsp.emit(event, data);
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};
