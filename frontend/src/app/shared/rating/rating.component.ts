import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- Rating submission form -->
    @if (mode === 'submit') {
      <mat-card class="rating-card card-elevated">
        <mat-card-header>
          <mat-card-title>Rate this service</mat-card-title>
          <mat-card-subtitle>How was your experience?</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (submitted) {
            <div class="success-banner">
              <mat-icon>check_circle</mat-icon>
              Thank you for your rating!
            </div>
          } @else {
            <!-- Star selector -->
            <div class="stars-selector">
              @for (star of [1,2,3,4,5]; track star) {
                <button mat-icon-button (click)="setStars(star)" class="star-btn">
                  <mat-icon [class.filled]="star <= selectedStars">
                    {{ star <= selectedStars ? 'star' : 'star_border' }}
                  </mat-icon>
                </button>
              }
              <span class="stars-label">{{ starsLabel }}</span>
            </div>

            <form [formGroup]="ratingForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Write a review (optional)</mat-label>
                <textarea matInput formControlName="reviewText" rows="4"
                          placeholder="Tell others about your experience..." maxlength="1000"></textarea>
                <mat-hint align="end">{{ ratingForm.get('reviewText')?.value?.length || 0 }}/1000</mat-hint>
              </mat-form-field>

              @if (errorMessage) {
                <div class="error-banner">{{ errorMessage }}</div>
              }

              <button mat-flat-button class="btn-action full-width" type="submit"
                      [disabled]="loading || selectedStars === 0">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Submit Rating
                }
              </button>
            </form>
          }
        </mat-card-content>
      </mat-card>
    }

    <!-- Rating display mode -->
    @if (mode === 'display' && ratings.length > 0) {
      <div class="ratings-display">
        <div class="rating-summary">
          <span class="avg-rating">{{ averageRating | number:'1.1-1' }}</span>
          <div class="avg-stars">
            @for (star of [1,2,3,4,5]; track star) {
              <mat-icon class="display-star" [class.filled]="star <= averageRating">
                {{ star <= averageRating ? 'star' : (star - 0.5 <= averageRating ? 'star_half' : 'star_border') }}
              </mat-icon>
            }
          </div>
          <span class="total-count">{{ totalRatings }} reviews</span>
        </div>

        @for (rating of ratings; track rating.id) {
          <div class="review-item">
            <div class="review-header">
              <div class="review-stars">
                @for (star of [1,2,3,4,5]; track star) {
                  <mat-icon class="small-star" [class.filled]="star <= rating.stars">
                    {{ star <= rating.stars ? 'star' : 'star_border' }}
                  </mat-icon>
                }
              </div>
              <span class="review-date">{{ rating.created_at | date:'mediumDate' }}</span>
            </div>
            @if (rating.review_text) {
              <p class="review-text">{{ rating.review_text }}</p>
            }
            @if (rating.provider_response) {
              <div class="provider-response">
                <span class="response-label">Provider response:</span>
                <p>{{ rating.provider_response }}</p>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .rating-card { max-width: 500px; margin: 16px auto; }
    .stars-selector { display: flex; align-items: center; margin-bottom: 16px; }
    .star-btn mat-icon { font-size: 32px; width: 32px; height: 32px; color: #ccc; }
    .star-btn mat-icon.filled { color: #FFB800; }
    .stars-label { margin-left: 12px; color: #666; font-size: 0.9rem; }
    .full-width { width: 100%; }
    .error-banner { background: #fdecea; color: #d32f2f; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
    .success-banner { background: #e8f5e9; color: #2e7d32; padding: 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; }
    .ratings-display { padding: 16px 0; }
    .rating-summary { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .avg-rating { font-size: 2rem; font-weight: 700; }
    .avg-stars { display: flex; }
    .display-star { font-size: 20px; width: 20px; height: 20px; color: #ccc; }
    .display-star.filled { color: #FFB800; }
    .total-count { color: #666; font-size: 0.875rem; }
    .review-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .review-header { display: flex; justify-content: space-between; align-items: center; }
    .review-stars { display: flex; }
    .small-star { font-size: 16px; width: 16px; height: 16px; color: #ccc; }
    .small-star.filled { color: #FFB800; }
    .review-date { font-size: 0.75rem; color: #999; }
    .review-text { margin: 8px 0; font-size: 0.9rem; color: #333; }
    .provider-response { background: #f9f9f9; padding: 8px 12px; border-radius: 8px; margin-top: 8px; border-left: 3px solid #06C167; }
    .response-label { font-size: 0.75rem; font-weight: 600; color: #06C167; }
    .provider-response p { margin: 4px 0 0; font-size: 0.85rem; color: #333; }
  `]
})
export class RatingComponent {
  @Input() mode: 'submit' | 'display' = 'submit';
  @Input() bookingId = '';
  @Input() providerId = '';
  @Input() ratings: any[] = [];
  @Input() averageRating = 0;
  @Input() totalRatings = 0;
  @Output() ratingSubmitted = new EventEmitter<void>();

  ratingForm: FormGroup;
  selectedStars = 0;
  loading = false;
  submitted = false;
  errorMessage = '';

  readonly starsLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  get starsLabel(): string {
    return this.starsLabels[this.selectedStars] || '';
  }

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.ratingForm = this.fb.group({
      reviewText: ['', [Validators.maxLength(1000)]],
    });
  }

  setStars(stars: number): void {
    this.selectedStars = stars;
  }

  onSubmit(): void {
    if (this.selectedStars === 0) return;

    this.loading = true;
    this.errorMessage = '';

    const body = {
      bookingId: this.bookingId,
      stars: this.selectedStars,
      reviewText: this.ratingForm.get('reviewText')?.value || undefined,
    };

    this.http.post(`${environment.apiUrl}/ratings`, body).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
        this.ratingSubmitted.emit();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to submit rating';
      }
    });
  }
}
