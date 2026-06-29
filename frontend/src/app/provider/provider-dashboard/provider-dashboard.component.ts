import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil, interval } from 'rxjs';

interface BookingRequest {
  id: string;
  reference_code: string;
  description: string;
  address: string;
  scheduled_at: string;
  estimated_duration_minutes: number;
  status: string;
  created_at: string;
}

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h2>Provider Dashboard</h2>
        <mat-slide-toggle color="accent" [checked]="isOnline" (change)="toggleAvailability($event.checked)">
          {{ isOnline ? 'Online' : 'Offline' }}
        </mat-slide-toggle>
      </div>

      <div class="stats-grid">
        <mat-card class="stat-card card-elevated">
          <mat-card-content>
            <p class="stat-label">Today's Earnings</p>
            <p class="stat-value">R{{ todayEarnings | number:'1.2-2' }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card card-elevated">
          <mat-card-content>
            <p class="stat-label">Completed Jobs</p>
            <p class="stat-value">{{ completedJobs }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card card-elevated">
          <mat-card-content>
            <p class="stat-label">Rating</p>
            <p class="stat-value">{{ rating > 0 ? (rating | number:'1.1-1') : '--' }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card card-elevated">
          <mat-card-content>
            <p class="stat-label">Acceptance Rate</p>
            <p class="stat-value">{{ acceptanceRate >= 0 ? (acceptanceRate | number:'1.0-0') + '%' : '--%' }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Incoming Booking Requests -->
      <h3>Incoming Requests</h3>
      @if (pendingRequests.length === 0) {
        <mat-card class="card-elevated empty-state">
          <mat-card-content>
            <mat-icon>hourglass_empty</mat-icon>
            <p>No incoming requests</p>
          </mat-card-content>
        </mat-card>
      } @else {
        @for (request of pendingRequests; track request.id) {
          <mat-card class="request-card card-elevated">
            <mat-card-content>
              <div class="request-header">
                <span class="request-category">{{ request.description }}</span>
                <span class="request-timer" [class.urgent]="getTimeRemaining(request) < 30">
                  {{ getTimeRemaining(request) }}s
                </span>
              </div>
              <p class="request-address">
                <mat-icon>location_on</mat-icon>
                {{ request.address }}
              </p>
              <p class="request-duration">
                <mat-icon>schedule</mat-icon>
                {{ request.estimated_duration_minutes }} min estimated
              </p>
              <div class="request-actions">
                <button mat-flat-button class="btn-action" (click)="acceptRequest(request.id)">Accept</button>
                <button mat-stroked-button color="warn" (click)="declineRequest(request.id)">Decline</button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 16px; max-width: 1200px; margin: 0 auto; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h2 { font-weight: 600; }
    h3 { font-weight: 600; margin: 24px 0 12px; }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
    .stat-label { color: #666; font-size: 0.875rem; margin-bottom: 4px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; }
    .empty-state { text-align: center; padding: 32px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .request-card { margin-bottom: 12px; }
    .request-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .request-category { font-weight: 600; font-size: 1rem; }
    .request-timer { background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.875rem; }
    .request-timer.urgent { background: #fdecea; color: #d32f2f; }
    .request-address, .request-duration { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.875rem; margin: 4px 0; }
    .request-actions { display: flex; gap: 8px; margin-top: 12px; }
  `]
})
export class ProviderDashboardComponent implements OnInit, OnDestroy {
  isOnline = false;
  todayEarnings = 0;
  completedJobs = 0;
  rating = 0;
  acceptanceRate = -1;
  pendingRequests: BookingRequest[] = [];
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProfile();
    // Refresh pending requests every 5 seconds
    interval(5000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadPendingRequests();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.http.get<any>(`${environment.apiUrl}/providers/profile`).subscribe({
      next: (profile) => {
        this.isOnline = profile.availability === 'online';
        this.rating = profile.average_rating || 0;
        this.completedJobs = profile.total_bookings || 0;
      },
      error: () => {}
    });
  }

  loadPendingRequests(): void {
    // This will be fully implemented with booking system
  }

  toggleAvailability(online: boolean): void {
    const availability = online ? 'online' : 'offline';
    this.http.patch(`${environment.apiUrl}/providers/availability`, { availability }).subscribe({
      next: () => { this.isOnline = online; },
      error: () => { this.isOnline = !online; } // Revert on error
    });
  }

  acceptRequest(bookingId: string): void {
    this.http.post(`${environment.apiUrl}/bookings/${bookingId}/accept`, {}).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== bookingId);
      }
    });
  }

  declineRequest(bookingId: string): void {
    this.http.post(`${environment.apiUrl}/bookings/${bookingId}/decline`, {}).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== bookingId);
      }
    });
  }

  getTimeRemaining(request: BookingRequest): number {
    const created = new Date(request.created_at).getTime();
    const elapsed = (Date.now() - created) / 1000;
    return Math.max(0, Math.round(120 - elapsed)); // 2-minute countdown
  }
}
