import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleMapsModule } from '@angular/google-maps';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

interface GeoPoint {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    GoogleMapsModule
  ],
  template: `
    <div class="tracking-container">
      <!-- Map view -->
      <div class="tracking-map">
        @if (mapLoaded) {
          <google-map
            [center]="mapCenter"
            [zoom]="15"
            [options]="mapOptions"
            class="map-full">
            <!-- User marker -->
            @if (userPosition) {
              <map-marker [position]="userPosition" [options]="userMarkerOpts" title="You"></map-marker>
            }
            <!-- Provider marker -->
            @if (providerPosition) {
              <map-marker [position]="providerPosition" [options]="providerMarkerOpts" title="Provider"></map-marker>
            }
          </google-map>
        } @else {
          <div class="map-loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        }

        <!-- Stale data indicator -->
        @if (isStale) {
          <div class="stale-indicator">
            <mat-icon>warning</mat-icon>
            <span>Location data may be outdated</span>
          </div>
        }
      </div>

      <!-- Info panel -->
      <div class="tracking-panel">
        <mat-card class="card-elevated">
          <mat-card-content>
            <div class="eta-display">
              <div class="eta-main">
                <span class="eta-value">{{ etaMinutes }}</span>
                <span class="eta-label">min away</span>
              </div>
              <div class="distance-info">
                <mat-icon>place</mat-icon>
                <span>{{ distanceKm }} km</span>
              </div>
            </div>

            <!-- Status -->
            <div class="tracking-status">
              @if (arrived) {
                <div class="arrived-banner">
                  <mat-icon>check_circle</mat-icon>
                  <span>Provider has arrived!</span>
                </div>
              } @else if (connected) {
                <div class="connected-status">
                  <div class="pulse-dot"></div>
                  <span>Tracking live</span>
                </div>
              } @else {
                <div class="connecting-status">
                  <mat-spinner diameter="16"></mat-spinner>
                  <span>Connecting...</span>
                </div>
              }
            </div>

            <button mat-stroked-button class="full-width" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Back to Booking
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .tracking-container { display: flex; flex-direction: column; height: 100vh; }
    .tracking-map { flex: 1; position: relative; min-height: 60vh; }
    .map-full { width: 100%; height: 100%; }
    .map-loading { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .stale-indicator {
      position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
      background: #fff3e0; color: #e65100; padding: 8px 16px; border-radius: 8px;
      display: flex; align-items: center; gap: 8px; font-size: 0.875rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12); z-index: 5;
    }
    .tracking-panel { padding: 16px; }
    .eta-display { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .eta-main { display: flex; flex-direction: column; }
    .eta-value { font-size: 2.5rem; font-weight: 700; line-height: 1; }
    .eta-label { font-size: 0.875rem; color: #666; }
    .distance-info { display: flex; align-items: center; gap: 4px; color: #666; }
    .tracking-status { margin-bottom: 16px; }
    .arrived-banner { background: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .connected-status { display: flex; align-items: center; gap: 8px; color: #06C167; font-size: 0.875rem; }
    .connecting-status { display: flex; align-items: center; gap: 8px; color: #666; font-size: 0.875rem; }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #06C167; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .full-width { width: 100%; }
  `]
})
export class TrackingMapComponent implements OnInit, OnDestroy {
  mapLoaded = true;
  mapCenter: google.maps.LatLngLiteral = { lat: -26.2041, lng: 28.0473 };
  mapOptions: google.maps.MapOptions = { disableDefaultUI: true, zoomControl: true };

  userPosition: google.maps.LatLngLiteral | null = null;
  providerPosition: google.maps.LatLngLiteral | null = null;

  userMarkerOpts: google.maps.MarkerOptions = {};
  providerMarkerOpts: google.maps.MarkerOptions = {};

  etaMinutes = 0;
  distanceKm = 0;
  arrived = false;
  isStale = false;
  connected = false;

  private socket: Socket | null = null;
  private bookingId = '';
  private staleTimer: any;
  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.params['id'];
    this.detectUserLocation();
    this.connectSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.socket) {
      this.socket.emit('tracking:unsubscribe', { bookingId: this.bookingId });
      this.socket.disconnect();
    }
    if (this.staleTimer) clearTimeout(this.staleTimer);
  }

  goBack(): void {
    this.router.navigate(['/booking/status', this.bookingId]);
  }

  private detectUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.mapCenter = this.userPosition;
        },
        () => {}
      );
    }
  }

  private connectSocket(): void {
    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.socket!.emit('tracking:subscribe', { bookingId: this.bookingId });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    // Provider location updates
    this.socket.on('provider:location', (data: { location: { latitude: number; longitude: number }; timestamp: Date }) => {
      this.providerPosition = { lat: data.location.latitude, lng: data.location.longitude };
      this.isStale = false;
      this.resetStaleTimer();
    });

    // ETA updates
    this.socket.on('provider:eta', (data: { etaMinutes: number; distanceKm: number }) => {
      this.etaMinutes = data.etaMinutes;
      this.distanceKm = data.distanceKm;
    });

    // Arrival notification
    this.socket.on('provider:arrived', () => {
      this.arrived = true;
      this.etaMinutes = 0;
    });

    // Stale data
    this.socket.on('tracking:stale', (data: { lastKnownLocation: { latitude: number; longitude: number } }) => {
      this.isStale = true;
      this.providerPosition = { lat: data.lastKnownLocation.latitude, lng: data.lastKnownLocation.longitude };
    });

    // Tracking ended (service began)
    this.socket.on('tracking:ended', () => {
      this.goBack();
    });
  }

  private resetStaleTimer(): void {
    if (this.staleTimer) clearTimeout(this.staleTimer);
    this.staleTimer = setTimeout(() => {
      this.isStale = true;
    }, 60000); // 60 seconds
  }
}
