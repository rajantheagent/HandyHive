import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-booking-request',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatInputModule, MatButtonModule,
    MatFormFieldModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="booking-container">
      <mat-card class="card-elevated">
        <mat-card-header>
          <mat-card-title>Book Service</mat-card-title>
          <mat-card-subtitle>Describe what you need done</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="errorMessage" class="error-banner">{{ errorMessage }}</div>

          <div *ngIf="providerInfo" class="provider-summary">
            <div class="prov-avatar">{{ providerInfo.full_name?.charAt(0) }}</div>
            <div>
              <strong>{{ providerInfo.full_name }}</strong>
              <span *ngIf="providerInfo.hourly_rate"> · R{{ providerInfo.hourly_rate }}/hr</span>
            </div>
          </div>

          <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>What do you need help with?</mat-label>
              <textarea matInput formControlName="description" rows="3"
                        placeholder="E.g. Fix leaking kitchen tap, install new light switch..." maxlength="500"></textarea>
              <mat-hint align="end">{{ bookingForm.get('description')?.value?.length || 0 }}/500</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Address</mat-label>
              <input matInput formControlName="address" placeholder="Where should the provider come?">
              <button mat-icon-button matSuffix type="button" (click)="captureLocation()" title="Use my current location">
                <mat-icon>my_location</mat-icon>
              </button>
            </mat-form-field>
            <div *ngIf="locationMsg" class="location-msg">📍 {{ locationMsg }}</div>

            <button mat-flat-button class="btn-action full-width submit-btn" type="submit"
                    [disabled]="loading || bookingForm.invalid || !providerId">
              <span *ngIf="loading"><mat-spinner diameter="20"></mat-spinner></span>
              <span *ngIf="!loading">Confirm Booking</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .booking-container { padding: 24px 20px; max-width: 480px; margin: 0 auto; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 12px; height: 48px; font-size: 1rem; }
    .error-banner { background: #fdecea; color: #d32f2f; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .provider-summary { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9f9f9; border-radius: 10px; margin-bottom: 16px; }
    .prov-avatar { width: 40px; height: 40px; border-radius: 50%; background: #06C167; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .provider-summary strong { font-size: 0.95rem; }
    .provider-summary span { font-size: 0.8rem; color: #666; }
    .location-msg { font-size: 0.78rem; color: #06C167; margin: -8px 0 12px 4px; }
  `]
})
export class BookingRequestComponent implements OnInit {
  bookingForm: FormGroup;
  loading = false;
  errorMessage = '';
  providerInfo: any = null;
  providerId = '';
  categoryId = '';
  locationMsg = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bookingForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(500)]],
      address: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.providerId = this.route.snapshot.queryParams['providerId'] || '';
    this.categoryId = this.route.snapshot.queryParams['categoryId'] || '';

    if (this.providerId) {
      this.http.get<any>(`${environment.apiUrl}/search/providers/${this.providerId}`).subscribe({
        next: (p) => { this.providerInfo = p; },
        error: () => {}
      });
    }
  }

  captureLocation(): void {
    if (navigator.geolocation) {
      this.locationMsg = 'Detecting location...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          // Reverse geocode to get address
          this.http.post<any>(`${environment.apiUrl}/reverse-geocode`, {
            latitude: pos.coords.latitude, longitude: pos.coords.longitude
          }).subscribe({
            next: (result) => {
              this.bookingForm.patchValue({ address: result.formatted_address });
              this.locationMsg = `Location captured (${lat}, ${lng})`;
            },
            error: () => {
              this.bookingForm.patchValue({ address: `Lat: ${lat}, Lng: ${lng}` });
              this.locationMsg = `Location captured (${lat}, ${lng})`;
            }
          });
        },
        () => { this.locationMsg = 'Could not detect location. Please enter manually.'; }
      );
    } else {
      this.locationMsg = 'Geolocation not supported by your browser.';
    }
  }

  onSubmit(): void {
    if (this.bookingForm.invalid || !this.providerId) return;
    this.loading = true;
    this.errorMessage = '';

    const { description, address } = this.bookingForm.value;

    this.http.post<any>(`${environment.apiUrl}/bookings`, {
      providerId: this.providerId,
      categoryId: this.categoryId || undefined,
      address,
      description,
    }).subscribe({
      next: (booking) => {
        this.loading = false;
        this.router.navigate(['/booking/status', booking.id]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create booking. Please try again.';
      }
    });
  }
}
