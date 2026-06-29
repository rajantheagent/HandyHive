import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil, interval } from 'rxjs';

@Component({
  selector: 'app-booking-status',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatDialogModule
  ],
  template: `
    <div class="status-container">
      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (booking) {
        <mat-card class="card-elevated status-card">
          <mat-card-header>
            <mat-card-title>Booking {{ booking.reference_code }}</mat-card-title>
            <mat-card-subtitle>
              <span class="status-badge" [class]="'status-' + booking.status">{{ booking.status | uppercase }}</span>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Status timeline -->
            <div class="status-timeline">
              @for (step of statusSteps; track step.status) {
                <div class="timeline-step" [class.active]="isStepActive(step.status)" [class.completed]="isStepCompleted(step.status)">
                  <div class="step-dot"></div>
                  <div class="step-info">
                    <span class="step-label">{{ step.label }}</span>
                    @if (isStepActive(step.status)) {
                      <span class="step-time">Now</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Booking details -->
            <div class="details-section">
              @if (booking.description) {
                <div class="detail-row">
                  <mat-icon>description</mat-icon>
                  <span>{{ booking.description }}</span>
                </div>
              }
              @if (booking.address) {
                <div class="detail-row">
                  <mat-icon>place</mat-icon>
                  <span>{{ booking.address }}</span>
                </div>
              }
              @if (booking.scheduled_at) {
                <div class="detail-row">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ booking.scheduled_at | date:'medium' }}</span>
                </div>
              }
              @if (booking.estimated_cost) {
                <div class="detail-row">
                  <mat-icon>payments</mat-icon>
                  <span>Estimated: R{{ booking.estimated_cost | number:'1.2-2' }}</span>
                </div>
              }
            </div>

            <!-- Waiting for provider (2-min countdown) -->
            @if (booking.status === 'requested') {
              <div class="waiting-section">
                <mat-spinner diameter="24"></mat-spinner>
                <p>Waiting for provider to respond...</p>
                <span class="countdown">{{ countdown }}s remaining</span>
              </div>
            }

            <!-- Alternative providers on decline/expiry -->
            @if ((booking.status === 'declined' || booking.status === 'expired') && alternatives.length > 0) {
              <div class="alternatives-section">
                <h4>Alternative Providers Available</h4>
                @for (alt of alternatives; track alt.id) {
                  <div class="alt-provider">
                    <span>{{ alt.full_name }} · ⭐ {{ alt.average_rating | number:'1.1-1' }}</span>
                    <button mat-stroked-button (click)="bookAlternative(alt.id)">Book</button>
                  </div>
                }
              </div>
            }

            <!-- Actions -->
            <div class="action-buttons">
              @if (booking.status === 'en_route' || booking.status === 'accepted') {
                <button mat-flat-button class="btn-action" (click)="trackProvider()">
                  <mat-icon>my_location</mat-icon>
                  Track Provider
                </button>
              }
              @if (canCancel) {
                <button mat-stroked-button color="warn" (click)="cancelBooking()">
                  Cancel Booking
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .status-container { padding: 16px; max-width: 500px; margin: 0 auto; }
    .loading-state { display: flex; justify-content: center; padding: 48px; }
    .status-badge { padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .status-requested { background: #fff3e0; color: #e65100; }
    .status-accepted, .status-en_route, .status-arrived, .status-in_progress { background: #e8f5e9; color: #06C167; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-cancelled, .status-declined, .status-expired { background: #fdecea; color: #d32f2f; }
    .status-timeline { margin: 24px 0; padding-left: 16px; border-left: 2px solid #e0e0e0; }
    .timeline-step { position: relative; padding: 12px 0 12px 24px; }
    .step-dot { position: absolute; left: -9px; top: 16px; width: 16px; height: 16px; border-radius: 50%; background: #e0e0e0; border: 2px solid white; }
    .timeline-step.active .step-dot { background: #06C167; box-shadow: 0 0 0 4px rgba(6, 193, 103, 0.2); }
    .timeline-step.completed .step-dot { background: #06C167; }
    .step-label { font-size: 0.9rem; }
    .step-time { font-size: 0.75rem; color: #06C167; margin-left: 8px; }
    .details-section { margin: 16px 0; }
    .detail-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-size: 0.9rem; color: #333; }
    .detail-row mat-icon { font-size: 18px; width: 18px; height: 18px; color: #666; }
    .waiting-section { text-align: center; padding: 24px; background: #fafafa; border-radius: 8px; margin: 16px 0; }
    .waiting-section p { margin: 8px 0 4px; color: #666; }
    .countdown { font-weight: 600; color: #e65100; }
    .alternatives-section { margin: 16px 0; }
    .alternatives-section h4 { margin-bottom: 8px; }
    .alt-provider { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-radius: 8px; background: #f5f5f5; margin-bottom: 8px; }
    .action-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  `]
})
export class BookingStatusComponent implements OnInit, OnDestroy {
  booking: any = null;
  loading = true;
  countdown = 120;
  alternatives: any[] = [];
  private bookingId = '';
  private destroy$ = new Subject<void>();

  statusSteps = [
    { status: 'requested', label: 'Request Sent' },
    { status: 'accepted', label: 'Accepted' },
    { status: 'en_route', label: 'Provider En Route' },
    { status: 'arrived', label: 'Provider Arrived' },
    { status: 'in_progress', label: 'Service In Progress' },
    { status: 'completed', label: 'Completed' },
  ];

  get canCancel(): boolean {
    return this.booking && ['requested', 'accepted', 'en_route'].includes(this.booking.status);
  }

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.params['id'];
    this.loadBooking();

    // Poll booking status every 5 seconds
    interval(5000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshBooking();
    });

    // Countdown timer
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.booking?.status === 'requested' && this.countdown > 0) {
        this.countdown--;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isStepActive(status: string): boolean {
    return this.booking?.status === status;
  }

  isStepCompleted(status: string): boolean {
    const order = this.statusSteps.map(s => s.status);
    const currentIdx = order.indexOf(this.booking?.status);
    const stepIdx = order.indexOf(status);
    return stepIdx < currentIdx;
  }

  trackProvider(): void {
    this.router.navigate(['/booking/tracking', this.bookingId]);
  }

  cancelBooking(): void {
    this.http.post<any>(`${environment.apiUrl}/bookings/${this.bookingId}/cancel`, {}).subscribe({
      next: (result) => {
        this.loadBooking();
      }
    });
  }

  bookAlternative(providerId: string): void {
    this.router.navigate(['/booking/request'], {
      queryParams: { providerId, categoryId: this.booking?.category_id }
    });
  }

  private loadBooking(): void {
    this.http.get<any>(`${environment.apiUrl}/bookings/${this.bookingId}`).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.loading = false;
        this.calculateCountdown();

        if (booking.status === 'declined' || booking.status === 'expired') {
          this.loadAlternatives();
        }
      },
      error: () => { this.loading = false; }
    });
  }

  private refreshBooking(): void {
    if (!this.bookingId) return;
    this.http.get<any>(`${environment.apiUrl}/bookings/${this.bookingId}`).subscribe({
      next: (booking) => { this.booking = booking; }
    });
  }

  private loadAlternatives(): void {
    this.http.get<any[]>(`${environment.apiUrl}/bookings/${this.bookingId}/alternatives`).subscribe({
      next: (alts) => { this.alternatives = alts; },
      error: () => {}
    });
  }

  private calculateCountdown(): void {
    if (this.booking?.status === 'requested') {
      const created = new Date(this.booking.created_at).getTime();
      const elapsed = (Date.now() - created) / 1000;
      this.countdown = Math.max(0, Math.round(120 - elapsed));
    }
  }
}
