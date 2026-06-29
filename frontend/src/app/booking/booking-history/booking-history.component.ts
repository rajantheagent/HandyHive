import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatChipsModule
  ],
  template: `
    <div class="history-container">
      <h2>Booking History</h2>

      @if (bookings.length === 0 && !loading) {
        <mat-card class="card-elevated empty-state">
          <mat-card-content>
            <mat-icon>history</mat-icon>
            <p>No bookings yet</p>
          </mat-card-content>
        </mat-card>
      }

      @for (booking of bookings; track booking.id) {
        <mat-card class="booking-card card-elevated" (click)="viewBooking(booking.id)">
          <mat-card-content>
            <div class="booking-header">
              <span class="ref-code">{{ booking.reference_code }}</span>
              <span class="status-chip" [class]="'status-' + booking.status">{{ booking.status }}</span>
            </div>
            <p class="booking-desc">{{ booking.description || 'No description' }}</p>
            <div class="booking-meta">
              <span><mat-icon>place</mat-icon> {{ booking.address || 'N/A' }}</span>
              <span><mat-icon>schedule</mat-icon> {{ booking.created_at | date:'short' }}</span>
            </div>
            @if (booking.estimated_cost) {
              <p class="booking-cost">R{{ booking.estimated_cost | number:'1.2-2' }}</p>
            }
          </mat-card-content>
        </mat-card>
      }

      @if (total > 50) {
        <mat-paginator
          [length]="total"
          [pageSize]="50"
          [pageIndex]="currentPage - 1"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .history-container { padding: 16px; max-width: 800px; margin: 0 auto; }
    h2 { font-weight: 600; margin-bottom: 16px; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .booking-card { margin-bottom: 12px; cursor: pointer; transition: all 0.2s; }
    .booking-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .booking-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .ref-code { font-weight: 600; font-family: monospace; }
    .status-chip { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-requested { background: #fff3e0; color: #e65100; }
    .status-accepted { background: #e8f5e9; color: #2e7d32; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-cancelled { background: #fdecea; color: #d32f2f; }
    .status-declined, .status-expired { background: #f5f5f5; color: #666; }
    .status-en_route, .status-arrived, .status-in_progress { background: #e8f5e9; color: #06C167; }
    .booking-desc { margin: 8px 0; color: #333; font-size: 0.9rem; }
    .booking-meta { display: flex; gap: 16px; font-size: 0.8rem; color: #666; }
    .booking-meta span { display: flex; align-items: center; gap: 4px; }
    .booking-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .booking-cost { font-weight: 600; margin-top: 8px; }
  `]
})
export class BookingHistoryComponent implements OnInit {
  bookings: any[] = [];
  total = 0;
  currentPage = 1;
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/bookings/history`, {
      params: { page: this.currentPage.toString() }
    }).subscribe({
      next: (result) => {
        this.bookings = result.bookings;
        this.total = result.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.loadBookings();
  }

  viewBooking(id: string): void {
    this.router.navigate(['/booking/status', id]);
  }
}
