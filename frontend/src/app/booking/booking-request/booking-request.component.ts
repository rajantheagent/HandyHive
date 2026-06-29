import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-booking-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="booking-container">
      <mat-card class="card-elevated">
        <mat-card-header>
          <mat-card-title>Book Service</mat-card-title>
          <mat-card-subtitle>Describe what you need</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (errorMessage) {
            <div class="error-banner">{{ errorMessage }}</div>
          }

          <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4"
                        placeholder="Describe the work needed..." maxlength="500"></textarea>
              <mat-hint align="end">{{ bookingForm.get('description')?.value?.length || 0 }}/500</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Address</mat-label>
              <input matInput formControlName="address" placeholder="Where should the provider come?">
              <mat-icon matSuffix>place</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Estimated Duration (minutes)</mat-label>
              <mat-select formControlName="estimatedDuration">
                <mat-option [value]="30">30 minutes</mat-option>
                <mat-option [value]="60">1 hour</mat-option>
                <mat-option [value]="90">1.5 hours</mat-option>
                <mat-option [value]="120">2 hours</mat-option>
                <mat-option [value]="180">3 hours</mat-option>
                <mat-option [value]="240">4 hours</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Schedule For (optional)</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="scheduledDate" [min]="minDate">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-hint>Leave empty for immediate service</mat-hint>
            </mat-form-field>

            @if (providerInfo) {
              <div class="provider-summary">
                <h4>{{ providerInfo.full_name }}</h4>
                <p>⭐ {{ providerInfo.average_rating | number:'1.1-1' }} · R{{ providerInfo.hourly_rate }}/hr</p>
              </div>
            }

            @if (estimatedCost > 0) {
              <div class="cost-estimate">
                <span>Estimated Cost:</span>
                <strong>R{{ estimatedCost | number:'1.2-2' }}</strong>
              </div>
            }

            <button mat-flat-button class="btn-action full-width submit-btn" type="submit"
                    [disabled]="loading || bookingForm.invalid">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Confirm Booking
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .booking-container { padding: 16px; max-width: 500px; margin: 0 auto; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 16px; height: 48px; font-size: 16px; }
    .error-banner { background: #fdecea; color: #d32f2f; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .provider-summary { background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .provider-summary h4 { margin: 0 0 4px; }
    .provider-summary p { margin: 0; color: #666; font-size: 0.875rem; }
    .cost-estimate { display: flex; justify-content: space-between; padding: 12px; background: #e8f5e9; border-radius: 8px; margin-bottom: 16px; }
  `]
})
export class BookingRequestComponent implements OnInit {
  bookingForm: FormGroup;
  loading = false;
  errorMessage = '';
  providerInfo: any = null;
  estimatedCost = 0;
  minDate = new Date();
  private providerId = '';
  private categoryId = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bookingForm = this.fb.group({
      description: ['', [Validators.maxLength(500)]],
      address: ['', Validators.required],
      estimatedDuration: [60, Validators.required],
      scheduledDate: [null],
    });

    // Set min date to 2 hours from now
    this.minDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  ngOnInit(): void {
    this.providerId = this.route.snapshot.queryParams['providerId'] || '';
    this.categoryId = this.route.snapshot.queryParams['categoryId'] || '';

    if (this.providerId) {
      this.loadProviderInfo();
    }

    // Recalculate cost when duration changes
    this.bookingForm.get('estimatedDuration')?.valueChanges.subscribe(() => {
      this.calculateCost();
    });
  }

  private loadProviderInfo(): void {
    this.http.get<any>(`${environment.apiUrl}/search/providers/${this.providerId}`).subscribe({
      next: (provider) => {
        this.providerInfo = provider;
        this.calculateCost();
      }
    });
  }

  private calculateCost(): void {
    if (this.providerInfo?.hourly_rate) {
      const duration = this.bookingForm.get('estimatedDuration')?.value || 60;
      this.estimatedCost = (this.providerInfo.hourly_rate * duration) / 60;
    }
  }

  onSubmit(): void {
    if (this.bookingForm.invalid || !this.providerId) return;

    this.loading = true;
    this.errorMessage = '';

    const { description, address, estimatedDuration, scheduledDate } = this.bookingForm.value;

    const body: any = {
      providerId: this.providerId,
      categoryId: this.categoryId,
      address,
      description,
      estimatedDurationMinutes: estimatedDuration,
    };

    if (scheduledDate) {
      body.scheduledAt = new Date(scheduledDate).toISOString();
    }

    this.http.post<any>(`${environment.apiUrl}/bookings`, body).subscribe({
      next: (booking) => {
        this.loading = false;
        this.router.navigate(['/booking/status', booking.id]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to create booking';
      }
    });
  }
}
