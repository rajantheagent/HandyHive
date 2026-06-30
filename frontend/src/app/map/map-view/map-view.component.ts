import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface ProviderResult {
  id: string;
  full_name: string;
  hourly_rate: number | null;
  average_rating: number;
  total_ratings: number;
  distance_km: number;
  eta_minutes: number;
}

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatFormFieldModule, MatSelectModule, MatInputModule
  ],
  template: `
    <div class="map-page">
      <!-- Search Header -->
      <div class="search-header">
        <h2>Find Service Providers</h2>
        <div class="search-controls">
          <mat-form-field appearance="outline" class="category-field">
            <mat-label>Service Type</mat-label>
            <mat-select [(ngModel)]="selectedCategory" (selectionChange)="search()">
              <mat-option value="">All Services</mat-option>
              <mat-option value="electrician">Electrician</mat-option>
              <mat-option value="plumber">Plumber</mat-option>
              <mat-option value="carpenter">Carpenter</mat-option>
              <mat-option value="painter">Painter</mat-option>
              <mat-option value="cleaner">Cleaner</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="radius-field">
            <mat-label>Radius</mat-label>
            <mat-select [(ngModel)]="radius" (selectionChange)="search()">
              <mat-option [value]="5">5 km</mat-option>
              <mat-option [value]="10">10 km</mat-option>
              <mat-option [value]="15">15 km</mat-option>
              <mat-option [value]="25">25 km</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button class="btn-action search-btn" (click)="search()">
            <mat-icon>search</mat-icon> Search
          </button>
        </div>
      </div>

      <!-- Map placeholder + Results -->
      <div class="content-area">
        <div class="map-area">
          <div class="map-placeholder">
            <mat-icon class="map-icon">map</mat-icon>
            <p>Interactive map requires Google Maps API key</p>
            <p class="map-sub">Providers are listed below based on your location</p>
          </div>
        </div>

        <div class="results-panel">
          @if (loading) {
            <div class="loading-state">
              <mat-spinner diameter="32"></mat-spinner>
              <span>Searching nearby providers...</span>
            </div>
          } @else if (providers.length === 0 && hasSearched) {
            <div class="empty-state">
              <mat-icon>search_off</mat-icon>
              <p>No providers found nearby</p>
              <button mat-stroked-button (click)="expandRadius()">Expand radius</button>
            </div>
          } @else if (providers.length > 0) {
            <p class="results-count">{{ providers.length }} providers found within {{ radius }} km</p>
            @for (provider of providers; track provider.id) {
              <div class="provider-item">
                <div class="provider-avatar">{{ provider.full_name.charAt(0) }}</div>
                <div class="provider-info">
                  <strong>{{ provider.full_name }}</strong>
                  <div class="provider-meta">
                    <span>⭐ {{ provider.average_rating | number:'1.1-1' }}</span>
                    <span>📍 {{ provider.distance_km }} km</span>
                    <span>⏱ {{ provider.eta_minutes }} min</span>
                    @if (provider.hourly_rate) {
                      <span>💰 R{{ provider.hourly_rate }}/hr</span>
                    }
                  </div>
                </div>
                <a mat-flat-button class="btn-action book-btn" routerLink="/booking/request" [queryParams]="{ providerId: provider.id }">
                  Book
                </a>
              </div>
            }
          } @else {
            <div class="empty-state">
              <mat-icon>place</mat-icon>
              <p>Select a service type and search to find providers near you</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-page { max-width: 1140px; margin: 0 auto; padding: 24px 20px; }
    h2 { font-family: 'Poppins', sans-serif; font-weight: 700; margin: 0 0 16px; }
    .search-controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .category-field { min-width: 180px; }
    .radius-field { min-width: 120px; }
    .search-btn { height: 48px !important; }
    .content-area { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
    @media (max-width: 768px) { .content-area { grid-template-columns: 1fr; } }
    .map-area { min-height: 300px; }
    .map-placeholder {
      width: 100%; height: 100%; min-height: 300px; background: #f0f4f0; border-radius: 12px;
      display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888;
      border: 2px dashed #ccc;
    }
    .map-icon { font-size: 48px !important; width: 48px !important; height: 48px !important; color: #06C167; margin-bottom: 12px; }
    .map-sub { font-size: 0.8rem; }
    .results-panel { min-height: 300px; }
    .loading-state { display: flex; align-items: center; gap: 12px; padding: 24px; color: #666; }
    .empty-state { text-align: center; padding: 48px 16px; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .results-count { font-size: 0.85rem; color: #666; margin-bottom: 12px; }
    .provider-item {
      display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px;
      border: 1px solid #eee; margin-bottom: 12px; transition: all 0.25s ease;
    }
    .provider-item:hover { border-color: #06C167; box-shadow: 0 4px 12px rgba(6,193,103,0.08); }
    .provider-avatar {
      width: 42px; height: 42px; border-radius: 50%; background: #06C167; color: white;
      display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
    }
    .provider-info { flex: 1; }
    .provider-info strong { display: block; font-size: 0.95rem; }
    .provider-meta { display: flex; gap: 10px; font-size: 0.78rem; color: #666; margin-top: 4px; flex-wrap: wrap; }
    .book-btn { border-radius: 8px !important; font-size: 0.8rem !important; }
  `]
})
export class MapViewComponent implements OnInit {
  providers: ProviderResult[] = [];
  loading = false;
  hasSearched = false;
  selectedCategory = '';
  radius = 10;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // Auto-search on load
    this.search();
  }

  search(): void {
    this.loading = true;
    this.hasSearched = true;

    // Use a default location (Johannesburg) since we can't get GPS without HTTPS
    const params: any = {
      latitude: '-26.2041',
      longitude: '28.0473',
      radiusKm: this.radius.toString(),
    };
    if (this.selectedCategory) {
      params.categoryId = this.selectedCategory;
    }

    this.http.get<any>(`${environment.apiUrl}/search/providers`, { params }).subscribe({
      next: (result) => {
        this.providers = result.providers || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.providers = [];
      }
    });
  }

  expandRadius(): void {
    this.radius = Math.min(this.radius + 5, 25);
    this.search();
  }
}
