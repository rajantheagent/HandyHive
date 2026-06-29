import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-provider-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    @if (provider) {
      <mat-card class="provider-card card-elevated" [class.selected]="selected">
        <mat-card-content>
          <div class="card-header">
            <div class="provider-info">
              <h4>{{ provider.full_name }}</h4>
              <div class="rating">
                <mat-icon class="star-icon">star</mat-icon>
                <span>{{ provider.average_rating | number:'1.1-1' }}</span>
                <span class="rating-count">({{ provider.total_ratings }})</span>
              </div>
            </div>
            <div class="eta-badge">
              <span class="eta-value">{{ provider.eta_minutes }}</span>
              <span class="eta-label">min</span>
            </div>
          </div>

          <div class="card-details">
            <span class="detail">
              <mat-icon>place</mat-icon>
              {{ provider.distance_km }} km away
            </span>
            @if (provider.hourly_rate) {
              <span class="detail rate">
                R{{ provider.hourly_rate | number:'1.0-0' }}/hr
              </span>
            }
          </div>

          <button mat-flat-button class="btn-action book-btn" (click)="bookProvider($event)">
            Book Now
          </button>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .provider-card { margin-bottom: 12px; cursor: pointer; transition: all 0.2s ease; }
    .provider-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .provider-card.selected { border-left: 3px solid #06C167; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .provider-info h4 { margin: 0 0 4px; font-size: 1rem; font-weight: 600; }
    .rating { display: flex; align-items: center; gap: 2px; font-size: 0.875rem; }
    .star-icon { font-size: 16px; width: 16px; height: 16px; color: #FFB800; }
    .rating-count { color: #999; }
    .eta-badge {
      display: flex; flex-direction: column; align-items: center;
      background: #f5f5f5; padding: 6px 10px; border-radius: 8px;
    }
    .eta-value { font-size: 1.25rem; font-weight: 700; }
    .eta-label { font-size: 0.625rem; color: #666; text-transform: uppercase; }
    .card-details { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; }
    .detail { display: flex; align-items: center; gap: 4px; font-size: 0.875rem; color: #666; }
    .detail mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .rate { font-weight: 600; color: #000; }
    .book-btn { width: 100%; }
  `]
})
export class ProviderCardComponent {
  @Input() provider: any;
  @Input() selected = false;

  constructor(private router: Router) {}

  bookProvider(event: Event): void {
    event.stopPropagation();
    if (this.provider) {
      this.router.navigate(['/booking/request'], {
        queryParams: { providerId: this.provider.id }
      });
    }
  }
}
