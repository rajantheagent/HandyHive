import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';

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
    MatFormFieldModule, MatSelectModule
  ],
  template: `
    <div class="map-page">
      <div class="search-header">
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

      <div class="content-area">
        <div class="map-area" id="map">
          <button class="my-location-btn" (click)="goToMyLocation()" title="My Location">
            <mat-icon>my_location</mat-icon>
          </button>
        </div>

        <div class="results-panel">
          @if (loading) {
            <div class="loading-state"><mat-spinner diameter="28"></mat-spinner><span>Searching...</span></div>
          } @else if (providers.length === 0 && hasSearched) {
            <div class="empty-state">
              <mat-icon>search_off</mat-icon>
              <p>No providers found</p>
              <button mat-stroked-button (click)="expandRadius()">Expand radius</button>
            </div>
          } @else if (providers.length > 0) {
            <p class="results-count">{{ providers.length }} providers within {{ radius }} km</p>
            @for (provider of providers; track provider.id) {
              <div class="provider-item">
                <div class="provider-avatar">{{ provider.full_name.charAt(0) }}</div>
                <div class="provider-info">
                  <strong>{{ provider.full_name }}</strong>
                  <div class="provider-meta">
                    <span>⭐ {{ provider.average_rating | number:'1.1-1' }}</span>
                    <span>📍 {{ provider.distance_km }} km</span>
                    @if (provider.hourly_rate) { <span>R{{ provider.hourly_rate }}/hr</span> }
                  </div>
                </div>
                <a mat-flat-button class="btn-action book-btn" routerLink="/booking/request" [queryParams]="{providerId: provider.id}">Book</a>
              </div>
            }
          } @else {
            <div class="empty-state"><mat-icon>place</mat-icon><p>Search for providers near you</p></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-page { height: calc(100vh - 64px); display: flex; flex-direction: column; }
    .search-header { padding: 12px 16px; border-bottom: 1px solid #eee; }
    .search-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .category-field { min-width: 160px; }
    .radius-field { min-width: 100px; }
    .search-btn { height: 48px !important; }
    ::ng-deep .search-header .mat-mdc-form-field-subscript-wrapper { display: none; }
    .content-area { flex: 1; display: flex; overflow: hidden; }
    @media (max-width: 768px) { .content-area { flex-direction: column; } }
    .map-area { flex: 1; min-height: 300px; position: relative; }
    .my-location-btn {
      position: absolute; bottom: 16px; right: 16px; z-index: 1000;
      width: 40px; height: 40px; border-radius: 50%; border: none; background: white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: background 0.2s;
    }
    .my-location-btn:hover { background: #f0f0f0; }
    .my-location-btn mat-icon { color: #666; font-size: 20px; width: 20px; height: 20px; }
    .results-panel { width: 360px; overflow-y: auto; padding: 16px; border-left: 1px solid #eee; }
    @media (max-width: 768px) { .results-panel { width: 100%; max-height: 40vh; border-left: none; border-top: 1px solid #eee; } }
    .loading-state { display: flex; align-items: center; gap: 10px; padding: 24px; color: #666; }
    .empty-state { text-align: center; padding: 40px 16px; color: #888; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .results-count { font-size: 0.82rem; color: #666; margin: 0 0 12px; }
    .provider-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; border: 1px solid #eee; margin-bottom: 10px; transition: all 0.2s; }
    .provider-item:hover { border-color: #06C167; box-shadow: 0 4px 12px rgba(6,193,103,0.08); }
    .provider-avatar { width: 38px; height: 38px; border-radius: 50%; background: #06C167; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .provider-info { flex: 1; }
    .provider-info strong { font-size: 0.9rem; }
    .provider-meta { display: flex; gap: 8px; font-size: 0.75rem; color: #666; margin-top: 2px; }
    .book-btn { border-radius: 8px !important; font-size: 0.78rem !important; }
  `]
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  providers: ProviderResult[] = [];
  loading = false;
  hasSearched = false;
  selectedCategory = '';
  radius = 10;

  private map!: L.Map;
  private markers: L.Marker[] = [];
  private userLat = -26.2041;
  private userLng = 28.0473;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.detectLocation();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map('map').setView([this.userLat, this.userLng], 13);

    // OpenStreetMap tiles (free, no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // User location marker
    L.circleMarker([this.userLat, this.userLng], {
      radius: 8, fillColor: '#4285F4', color: '#fff', weight: 2, fillOpacity: 1
    }).addTo(this.map).bindPopup('You are here');
  }

  private detectLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLat = pos.coords.latitude;
          this.userLng = pos.coords.longitude;
          this.map.setView([this.userLat, this.userLng], 13);
          L.circleMarker([this.userLat, this.userLng], {
            radius: 8, fillColor: '#4285F4', color: '#fff', weight: 2, fillOpacity: 1
          }).addTo(this.map).bindPopup('You are here');
          this.search();
        },
        () => { this.search(); }
      );
    } else {
      this.search();
    }
  }

  search(): void {
    this.loading = true;
    this.hasSearched = true;

    const params: any = {
      latitude: this.userLat.toString(),
      longitude: this.userLng.toString(),
      radiusKm: this.radius.toString(),
    };
    if (this.selectedCategory) params.categoryId = this.selectedCategory;

    this.http.get<any>(`${environment.apiUrl}/search/providers`, { params }).subscribe({
      next: (result) => {
        this.providers = result.providers || [];
        this.loading = false;
        this.updateMapMarkers();
      },
      error: () => { this.loading = false; this.providers = []; }
    });
  }

  expandRadius(): void {
    this.radius = Math.min(this.radius + 5, 25);
    this.search();
  }

  goToMyLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLat = pos.coords.latitude;
          this.userLng = pos.coords.longitude;
          this.map.setView([this.userLat, this.userLng], 15);
          L.circleMarker([this.userLat, this.userLng], {
            radius: 8, fillColor: '#4285F4', color: '#fff', weight: 2, fillOpacity: 1
          }).addTo(this.map);
          this.search();
        },
        () => { alert('Could not detect your location. Please allow location access.'); }
      );
    }
  }

  private updateMapMarkers(): void {
    // Clear old markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    // Add provider markers
    this.providers.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const dist = p.distance_km / 111;
      const lat = this.userLat + dist * Math.cos(angle);
      const lng = this.userLng + dist * Math.sin(angle);

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'provider-map-marker',
          html: `<div style="background:#06C167;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${p.full_name.charAt(0)}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(this.map).bindPopup(`<b>${p.full_name}</b><br>⭐ ${p.average_rating} · ${p.distance_km}km`);

      this.markers.push(marker);
    });
  }
}
