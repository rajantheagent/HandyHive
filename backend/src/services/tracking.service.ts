import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AppDataSource } from '../config/data-source';
import { TrackingSession } from '../entities/TrackingSession';
import { Booking, BookingStatus } from '../entities/Booking';
import { redisService } from './redis.service';

const ARRIVAL_THRESHOLD_METERS = 100;
const STALE_THRESHOLD_MS = 60000; // 60 seconds
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
const SERVER_TIMEOUT_MS = 90000; // 90 seconds

interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in meters.
 */
function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class TrackingService {
  private io: SocketIOServer | null = null;
  private trackingSessionRepo = AppDataSource.getRepository(TrackingSession);
  private bookingRepo = AppDataSource.getRepository(Booking);

  /**
   * Initialize Socket.IO server with room-based architecture.
   */
  initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingInterval: HEARTBEAT_INTERVAL_MS,
      pingTimeout: SERVER_TIMEOUT_MS,
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Tracking] Client connected: ${socket.id}`);

      // Client subscribes to tracking for a booking
      socket.on('tracking:subscribe', async (data: { bookingId: string }) => {
        const { bookingId } = data;
        socket.join(`booking:${bookingId}`);
        console.log(`[Tracking] ${socket.id} subscribed to booking:${bookingId}`);
      });

      // Client unsubscribes from tracking
      socket.on('tracking:unsubscribe', (data: { bookingId: string }) => {
        const { bookingId } = data;
        socket.leave(`booking:${bookingId}`);
      });

      // Provider sends location update
      socket.on('location:update', async (data: { providerId: string; bookingId: string; location: GeoPoint }) => {
        await this.handleLocationUpdate(data.providerId, data.bookingId, data.location);
      });

      socket.on('disconnect', () => {
        console.log(`[Tracking] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  /**
   * Handle provider location update.
   * - Stores location in Redis
   * - Broadcasts to booking room
   * - Recalculates ETA
   * - Checks arrival threshold (100 meters)
   */
  private async handleLocationUpdate(
    providerId: string,
    bookingId: string,
    location: GeoPoint
  ): Promise<void> {
    if (!this.io) return;

    // Store in Redis for real-time position
    await redisService.setProviderLocation(providerId, location.latitude, location.longitude);

    // Get booking to find user location
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) return;

    // End tracking when booking status changes to in_progress
    if (booking.status === BookingStatus.IN_PROGRESS || booking.status === BookingStatus.COMPLETED) {
      this.io.to(`booking:${bookingId}`).emit('tracking:ended', { bookingId });
      return;
    }

    // Calculate distance and ETA (rough: ~20 km/h average speed in urban area)
    // For demo, use a simple distance-based ETA
    const userLocation = await this.getBookingLocation(booking);
    let distanceMeters = 0;
    let etaMinutes = 0;

    if (userLocation) {
      distanceMeters = calculateDistance(location, userLocation);
      etaMinutes = Math.round((distanceMeters / 1000) * 3); // ~3 min/km average
    }

    const now = new Date();

    // Broadcast location to room
    this.io.to(`booking:${bookingId}`).emit('provider:location', {
      bookingId,
      location,
      timestamp: now,
    });

    // Broadcast ETA
    this.io.to(`booking:${bookingId}`).emit('provider:eta', {
      bookingId,
      etaMinutes,
      distanceKm: parseFloat((distanceMeters / 1000).toFixed(2)),
    });

    // Check arrival threshold (100 meters)
    if (distanceMeters <= ARRIVAL_THRESHOLD_METERS && userLocation) {
      this.io.to(`booking:${bookingId}`).emit('provider:arrived', {
        bookingId,
        timestamp: now,
      });
    }

    // Update tracking session in DB
    await this.updateTrackingSession(bookingId, location, etaMinutes, distanceMeters / 1000);
  }

  /**
   * Start a tracking session for a booking.
   */
  async startTracking(bookingId: string): Promise<void> {
    const existing = await this.trackingSessionRepo.findOne({
      where: { booking_id: bookingId, is_active: true },
    });

    if (!existing) {
      const session = this.trackingSessionRepo.create({
        booking_id: bookingId,
        is_active: true,
        eta_minutes: 0,
        distance_km: 0,
      });
      await this.trackingSessionRepo.save(session);
    }
  }

  /**
   * Stop a tracking session.
   */
  async stopTracking(bookingId: string): Promise<void> {
    await this.trackingSessionRepo.update(
      { booking_id: bookingId, is_active: true },
      { is_active: false }
    );

    if (this.io) {
      this.io.to(`booking:${bookingId}`).emit('tracking:ended', { bookingId });
    }
  }

  /**
   * Emit stale data indicator if no update received for 60 seconds.
   */
  async checkStaleTracking(bookingId: string, providerId: string): Promise<void> {
    if (!this.io) return;

    const location = await redisService.getProviderLocation(providerId);
    if (location) {
      const timeSinceUpdate = Date.now() - location.timestamp;
      if (timeSinceUpdate > STALE_THRESHOLD_MS) {
        this.io.to(`booking:${bookingId}`).emit('tracking:stale', {
          bookingId,
          lastKnownLocation: { latitude: location.lat, longitude: location.lng },
          lastUpdate: new Date(location.timestamp),
        });
      }
    }
  }

  /**
   * Update tracking session with latest position data.
   */
  private async updateTrackingSession(
    bookingId: string,
    location: GeoPoint,
    etaMinutes: number,
    distanceKm: number
  ): Promise<void> {
    await this.trackingSessionRepo.update(
      { booking_id: bookingId, is_active: true },
      {
        eta_minutes: etaMinutes,
        distance_km: distanceKm,
        last_updated: new Date(),
      }
    );
  }

  /**
   * Get the user's location for a booking (from the booking's location or address).
   */
  private async getBookingLocation(booking: Booking): Promise<GeoPoint | null> {
    // In a real implementation, we'd query the PostGIS point
    // For now, return a mock location based on booking data
    // This would normally be extracted from the booking's geography column
    return null;
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const trackingService = new TrackingService();
