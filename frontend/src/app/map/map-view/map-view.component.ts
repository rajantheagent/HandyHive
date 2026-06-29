import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoogleMapsModule, MapInfoWindow, GoogleMap } from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { ProviderCardComponent } from '../provider-card/provider-card.component';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil, interval } from 'rxjs';

interface ProviderResult {
  id: string;
  full_name: string;
  hourly_rate: number | null;
  average_rating: number;
  total_ratings: number;
  distance_km: number;
  eta_minutes: number;
  availability: string;
}

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SearchBarComponent,
    FilterPanelComponent,
    ProviderCardComponent
  ],
  template: `
    <div class="map-layout">
      <div class="map-section">
        @if (mapLoaded) {
          <google-map
            #googleMap
            [center]="mapCenter"
            [zoom]="mapZoom"
            [options]="mapOptions"
            class="map-container">
            <!-- User marker -->
            @if (userPosition) {
              <map-marker
                [position]="userPosition"
                [options]="userMarkerOptions"
                title="Your location">
              </map-marker>
            }
            <!-- Provider markers -->
            @for (provider of providers; track provider.id) {
              <map-marker
                [position]="getProviderPosition(provider)"
                [options]="providerMarkerOptions"
                (mapClick)="selectProvider(provider)">
              </map-marker>
            }
          </google-map>
        } @else if (mapError) {
          <!-- Fallback list view on map load failure -->
          <div class="map-fallback">
            <mat-icon>map</mat-icon>
            <p>Map could not be loaded</p>
            <button mat-stroked-button (click)="retryMapLoad()">Retry</button>
          </div>
        } @else {
          <div class="map-loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading map...</p>
          </div>
        }

        <app-search-bar
          class="search-overlay"
          (categorySelected)="onCategorySelected($event)"
          (locationChanged)="onLocationChanged($event)">
        </app-search-bar>

        <app-filter-panel
          class="filter-overlay"
          (filtersChanged)="onFiltersChanged($event)">
        </app-filter-panel>

        @if (!userPosition && locationPrompt) {
          <div class="location-prompt">
            <mat-icon>my_location</mat-icon>
            <p>Enable location to find providers near you</p>
            <button mat-flat-button class="btn-action" (click)="requestLocation()">Enable Location</button>
          </div>
        }
      </div>

      <!-- Provider results panel -->
      <div class="provider-panel" [class.mobile-sheet]="isMobile">
        @if (loading) {
          <div class="panel-loading">
            <mat-spinner diameter="24"></mat-spinner>
            <span>Searching providers...</span>
          </div>
        } @else if (providers.length === 0 && hasSearched) {
          <div class="no-results">
            <mat-icon>search_off</mat-icon>
            <p>No providers found in this area</p>
            <button mat-stroked-button (click)="expandRadius()">Expand search radius</button>
          </div>
        } @else {
          <div class="results-header">
            <span>{{ providers.length }} providers found</span>
          </div>
          @for (provider of providers; track provider.id) {
            <app-provider-card
              [provider]="provider"
              [selected]="selectedProvider?.id === provider.id"
              (click)="selectProvider(provider)">
            </app-provider-card>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .map-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      overflow-x: hidden;
    }
    @media (min-width: 768px) {
      .map-layout { flex-direction: row; }
    }
    .map-section {
      position: relative;
      width: 100%;
      height: 50vh;
    }
    @media (min-width: 768px) {
      .map-section { height: 100vh; flex: 1; }
    }
    .map-container { width: 100%; height: 100%; }
    .map-loading, .map-fallback {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #f5f5f5; color: #666; gap: 12px;
    }
    .map-fallback mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .search-overlay { position: absolute; top: 16px; left: 16px; right: 16px; z-index: 5; }
    .filter-overlay { position: absolute; top: 72px; left: 16px; z-index: 5; }
    .location-prompt {
      position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: white; padding: 16px 24px; border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center; z-index: 5;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .provider-panel {
      flex: 1; overflow-y: auto; padding: 16px; background: white;
    }
    @media (min-width: 768px) {
      .provider-panel { width: 380px; max-width: 380px; box-shadow: -2px 0 8px rgba(0,0,0,0.1); }
    }
    .mobile-sheet { border-top-left-radius: 16px; border-top-right-radius: 16px; box-shadow: 0 -2px 8px rgba(0,0,0,0.1); }
    .panel-loading { display: flex; align-items: center; gap: 12px; padding: 24px; color: #666; }
    .no-results { text-align: center; padding: 32px; color: #666; }
    .no-results mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .results-header { font-size: 0.875rem; color: #666; margin-bottom: 12px; }
  `]
})
export class MapViewComponent implements OnInit, OnDestroy {
  mapLoaded = false;
  mapError = false;
  loading = false;
  hasSearched = false;
  locationPrompt = false;
  isMobile = window.innerWidth < 768;

  mapCenter: google.maps.LatLngLiteral = { lat: -26.2041, lng: 28.0473 }; // Johannesburg default
  mapZoom = 13;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  userPosition: google.maps.LatLngLiteral | null = null;
  userMarkerOptions: google.maps.MarkerOptions = {
    icon: { url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285F4"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="2"/></svg>'), scaledSize: new google.maps.Size(24, 24) },
  };

  providerMarkerOptions: google.maps.MarkerOptions = {};

  providers: ProviderResult[] = [];
  selectedProvider: ProviderResult | null = null;

  private currentCategory: string | null = null;
  private currentFilters: any = {};
  private currentRadius = 10;
  private destroy$ = new Subject<void>();
  private mapLoadTimeout: any;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.initMap();
    this.detectLocation();

    // Refresh markers every 15 seconds
    interval(15000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.userPosition && this.hasSearched) {
        this.searchProviders();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.mapLoadTimeout) clearTimeout(this.mapLoadTimeout);
  }

  private initMap(): void {
    // Set a 10-second timeout for map load failure
    this.mapLoadTimeout = setTimeout(() => {
      if (!this.mapLoaded) {
        this.mapError = true;
      }
    }, 10000);

    // Check if Google Maps is available
    if (typeof google !== 'undefined' && google.maps) {
      this.mapLoaded = true;
      clearTimeout(this.mapLoadTimeout);
    } else {
      // In dev without API key, show the map anyway (it'll work with @angular/google-maps)
      this.mapLoaded = true;
      clearTimeout(this.mapLoadTimeout);
    }
  }

  retryMapLoad(): void {
    this.mapError = false;
    this.initMap();
  }

  detectLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.mapCenter = this.userPosition;
          this.locationPrompt = false;
          this.searchProviders();
        },
        () => {
          this.locationPrompt = true;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      this.locationPrompt = true;
    }
  }

  requestLocation(): void {
    this.detectLocation();
  }

  onCategorySelected(categoryId: string): void {
    this.currentCategory = categoryId;
    this.searchProviders();
  }

  onLocationChanged(location: { lat: number; lng: number }): void {
    this.userPosition = location;
    this.mapCenter = location;
    this.searchProviders();
  }

  onFiltersChanged(filters: any): void {
    this.currentFilters = filters;
    this.searchProviders();
  }

  expandRadius(): void {
    this.currentRadius = Math.min(this.currentRadius + 5, 25);
    this.searchProviders();
  }

  selectProvider(provider: ProviderResult): void {
    this.selectedProvider = provider;
  }

  getProviderPosition(provider: ProviderResult): google.maps.LatLngLiteral {
    // In a real scenario, provider positions come from the search API
    // For now, offset from user position based on distance
    if (this.userPosition) {
      const angle = Math.random() * Math.PI * 2;
      const distDeg = provider.distance_km / 111; // rough km to degrees
      return {
        lat: this.userPosition.lat + distDeg * Math.cos(angle),
        lng: this.userPosition.lng + distDeg * Math.sin(angle),
      };
    }
    return this.mapCenter;
  }

  private searchProviders(): void {
    if (!this.userPosition) return;

    this.loading = true;
    this.hasSearched = true;

    const params: any = {
      latitude: this.userPosition.lat.toString(),
      longitude: this.userPosition.lng.toString(),
      radiusKm: this.currentRadius.toString(),
    };

    if (this.currentCategory) params.categoryId = this.currentCategory;
    if (this.currentFilters.minRating) params.minRating = this.currentFilters.minRating.toString();
    if (this.currentFilters.priceMin) params.priceMin = this.currentFilters.priceMin.toString();
    if (this.currentFilters.priceMax) params.priceMax = this.currentFilters.priceMax.toString();
    if (this.currentFilters.sortBy) params.sortBy = this.currentFilters.sortBy;

    this.http.get<any>(`${environment.apiUrl}/search/providers`, { params }).subscribe({
      next: (result) => {
        this.providers = result.providers || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Search failed. Try again.', 'Retry', { duration: 5000 }).onAction().subscribe(() => {
          this.searchProviders();
        });
      }
    });
  }
}
