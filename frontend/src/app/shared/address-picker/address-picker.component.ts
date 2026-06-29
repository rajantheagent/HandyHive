import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environments/environment';
import { debounceTime, Subject } from 'rxjs';

interface SavedAddress {
  id: string;
  label: string;
  full_address: string;
  is_default: boolean;
}

@Component({
  selector: 'app-address-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <div class="address-picker">
      <!-- Saved addresses -->
      @if (savedAddresses.length > 0) {
        <div class="saved-section">
          <h4>Saved Addresses</h4>
          @for (addr of savedAddresses; track addr.id) {
            <button mat-button class="saved-addr-btn" (click)="selectSavedAddress(addr)">
              <mat-icon>{{ addr.label === 'Home' ? 'home' : addr.label === 'Office' ? 'business' : 'place' }}</mat-icon>
              <div class="addr-text">
                <span class="addr-label">{{ addr.label }}</span>
                <span class="addr-detail">{{ addr.full_address }}</span>
              </div>
            </button>
          }
          <mat-divider></mat-divider>
        </div>
      }

      <!-- Search input -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Search address</mat-label>
        <input matInput
               [(ngModel)]="searchInput"
               (ngModelChange)="onInput($event)"
               [matAutocomplete]="auto"
               placeholder="Type to search...">
        <mat-icon matPrefix>search</mat-icon>
        <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onAutocompleteSelected($event.option.value)">
          @for (suggestion of suggestions; track suggestion.place_id) {
            <mat-option [value]="suggestion.description">{{ suggestion.description }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      <!-- Use current location -->
      <button mat-button class="current-location-btn" (click)="useCurrentLocation()">
        <mat-icon>my_location</mat-icon>
        Use current location
      </button>
    </div>
  `,
  styles: [`
    .address-picker { padding: 8px 0; }
    .saved-section { margin-bottom: 12px; }
    .saved-section h4 { font-size: 0.875rem; color: #666; margin: 0 0 8px; }
    .saved-addr-btn { width: 100%; text-align: left; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .addr-text { display: flex; flex-direction: column; }
    .addr-label { font-weight: 500; font-size: 0.875rem; }
    .addr-detail { font-size: 0.75rem; color: #666; }
    .full-width { width: 100%; }
    .current-location-btn { width: 100%; color: #06C167; }
  `]
})
export class AddressPickerComponent implements OnInit {
  @Output() addressSelected = new EventEmitter<{ address: string; lat: number; lng: number }>();

  searchInput = '';
  suggestions: { place_id: string; description: string }[] = [];
  savedAddresses: SavedAddress[] = [];

  private inputSubject = new Subject<string>();

  constructor(private http: HttpClient) {
    this.inputSubject.pipe(debounceTime(300)).subscribe(value => {
      if (value.length >= 3) {
        this.fetchSuggestions(value);
      } else {
        this.suggestions = [];
      }
    });
  }

  ngOnInit(): void {
    this.loadSavedAddresses();
  }

  onInput(value: string): void {
    this.inputSubject.next(value);
  }

  onAutocompleteSelected(address: string): void {
    this.http.post<any>(`${environment.apiUrl}/geocode`, { address }).subscribe({
      next: (result) => {
        this.addressSelected.emit({
          address,
          lat: result.latitude,
          lng: result.longitude,
        });
      }
    });
  }

  selectSavedAddress(addr: SavedAddress): void {
    // Geocode the saved address
    this.http.post<any>(`${environment.apiUrl}/geocode`, { address: addr.full_address }).subscribe({
      next: (result) => {
        this.addressSelected.emit({
          address: addr.full_address,
          lat: result.latitude,
          lng: result.longitude,
        });
      }
    });
  }

  useCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.http.post<any>(`${environment.apiUrl}/reverse-geocode`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }).subscribe({
            next: (result) => {
              this.addressSelected.emit({
                address: result.formatted_address,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            }
          });
        },
        () => {
          // Could not get location
        }
      );
    }
  }

  private loadSavedAddresses(): void {
    this.http.get<SavedAddress[]>(`${environment.apiUrl}/addresses`).subscribe({
      next: (addresses) => { this.savedAddresses = addresses; },
      error: () => {} // Not logged in or no addresses
    });
  }

  private fetchSuggestions(input: string): void {
    this.http.get<any[]>(`${environment.apiUrl}/autocomplete`, { params: { input } }).subscribe({
      next: (suggestions) => { this.suggestions = suggestions; },
      error: () => { this.suggestions = []; }
    });
  }
}
