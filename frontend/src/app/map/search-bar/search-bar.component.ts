import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../environments/environment';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatSelectModule
  ],
  template: `
    <div class="search-bar-container">
      <mat-form-field appearance="outline" class="category-select">
        <mat-label>Service</mat-label>
        <mat-select (selectionChange)="onCategoryChange($event.value)">
          <mat-option value="">All Services</mat-option>
          @for (cat of categories; track cat.id) {
            <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="address-input">
        <mat-label>Location</mat-label>
        <input matInput
               [(ngModel)]="addressInput"
               (ngModelChange)="onAddressInput($event)"
               [matAutocomplete]="auto"
               placeholder="Enter address...">
        <mat-icon matSuffix>search</mat-icon>
        <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSuggestionSelected($event.option.value)">
          @for (suggestion of suggestions; track suggestion.place_id) {
            <mat-option [value]="suggestion.description">{{ suggestion.description }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .search-bar-container {
      display: flex;
      gap: 8px;
      background: white;
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .category-select { flex: 0 0 140px; }
    .address-input { flex: 1; }
    ::ng-deep .search-bar-container .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class SearchBarComponent {
  @Output() categorySelected = new EventEmitter<string>();
  @Output() locationChanged = new EventEmitter<{ lat: number; lng: number }>();

  addressInput = '';
  suggestions: { place_id: string; description: string }[] = [];
  categories = [
    { id: '1', name: 'Electrician' },
    { id: '2', name: 'Plumber' },
    { id: '3', name: 'Carpenter' },
    { id: '4', name: 'Painter' },
    { id: '5', name: 'Cleaner' },
  ];

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

  onCategoryChange(categoryId: string): void {
    this.categorySelected.emit(categoryId);
  }

  onAddressInput(value: string): void {
    this.inputSubject.next(value);
  }

  onSuggestionSelected(address: string): void {
    // Geocode the selected address
    this.http.post<any>(`${environment.apiUrl}/geocode`, { address }).subscribe({
      next: (result) => {
        this.locationChanged.emit({ lat: result.latitude, lng: result.longitude });
      }
    });
  }

  private fetchSuggestions(input: string): void {
    this.http.get<any[]>(`${environment.apiUrl}/autocomplete`, { params: { input } }).subscribe({
      next: (suggestions) => { this.suggestions = suggestions; },
      error: () => { this.suggestions = []; }
    });
  }
}
