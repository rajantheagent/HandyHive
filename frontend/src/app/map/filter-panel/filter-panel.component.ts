import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule
  ],
  template: `
    @if (!expanded) {
      <button mat-stroked-button class="filter-btn" (click)="expanded = true">
        <mat-icon>tune</mat-icon>
        Filters
      </button>
    } @else {
      <div class="filter-panel">
        <div class="filter-header">
          <span>Filters</span>
          <button mat-icon-button (click)="expanded = false">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="filter-group">
          <label>Minimum Rating</label>
          <div class="rating-chips">
            @for (star of [1,2,3,4,5]; track star) {
              <button mat-stroked-button [class.active]="minRating === star" (click)="setMinRating(star)">
                {{ star }}★
              </button>
            }
          </div>
        </div>

        <div class="filter-group">
          <label>Price Range (R/hr)</label>
          <div class="price-range">
            <mat-form-field appearance="outline" class="price-field">
              <mat-label>Min</mat-label>
              <input matInput type="number" [(ngModel)]="priceMin" min="0">
            </mat-form-field>
            <span>—</span>
            <mat-form-field appearance="outline" class="price-field">
              <mat-label>Max</mat-label>
              <input matInput type="number" [(ngModel)]="priceMax" min="0">
            </mat-form-field>
          </div>
        </div>

        <div class="filter-group">
          <label>Sort By</label>
          <mat-form-field appearance="outline" class="full-width">
            <mat-select [(ngModel)]="sortBy">
              <mat-option value="distance">Distance (nearest)</mat-option>
              <mat-option value="rating">Rating (highest)</mat-option>
              <mat-option value="price">Price (lowest)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="filter-actions">
          <button mat-stroked-button (click)="clearFilters()">Clear</button>
          <button mat-flat-button class="btn-action" (click)="applyFilters()">Apply</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-btn {
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      border-radius: 8px;
    }
    .filter-panel {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 280px;
    }
    .filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: 600; }
    .filter-group { margin-bottom: 16px; }
    .filter-group label { font-size: 0.875rem; color: #666; display: block; margin-bottom: 8px; }
    .rating-chips { display: flex; gap: 4px; }
    .rating-chips button.active { background: #06C167; color: white; }
    .price-range { display: flex; align-items: center; gap: 8px; }
    .price-field { width: 100px; }
    .full-width { width: 100%; }
    .filter-actions { display: flex; gap: 8px; justify-content: flex-end; }
    ::ng-deep .filter-panel .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class FilterPanelComponent {
  @Output() filtersChanged = new EventEmitter<any>();

  expanded = false;
  minRating = 0;
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortBy = 'distance';

  setMinRating(rating: number): void {
    this.minRating = this.minRating === rating ? 0 : rating;
  }

  applyFilters(): void {
    this.filtersChanged.emit({
      minRating: this.minRating || undefined,
      priceMin: this.priceMin || undefined,
      priceMax: this.priceMax || undefined,
      sortBy: this.sortBy,
    });
    this.expanded = false;
  }

  clearFilters(): void {
    this.minRating = 0;
    this.priceMin = null;
    this.priceMax = null;
    this.sortBy = 'distance';
    this.filtersChanged.emit({});
    this.expanded = false;
  }
}
