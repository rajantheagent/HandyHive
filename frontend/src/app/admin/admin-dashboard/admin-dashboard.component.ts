import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-container">
      <h2>Admin Dashboard</h2>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
      } @else {
        <div class="metrics-grid">
          <mat-card class="metric-card card-elevated">
            <mat-card-content>
              <mat-icon>people</mat-icon>
              <p class="metric-value">{{ metrics.totalUsers }}</p>
              <p class="metric-label">Total Users</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="metric-card card-elevated">
            <mat-card-content>
              <mat-icon>engineering</mat-icon>
              <p class="metric-value">{{ metrics.activeProviders }}</p>
              <p class="metric-label">Active Providers</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="metric-card card-elevated">
            <mat-card-content>
              <mat-icon>event_note</mat-icon>
              <p class="metric-value">{{ metrics.dailyBookings }}</p>
              <p class="metric-label">Today's Bookings</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="metric-card card-elevated">
            <mat-card-content>
              <mat-icon>payments</mat-icon>
              <p class="metric-value">R{{ metrics.totalRevenue | number:'1.2-2' }}</p>
              <p class="metric-label">Total Revenue</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="metric-card card-elevated highlight">
            <mat-card-content>
              <mat-icon>pending_actions</mat-icon>
              <p class="metric-value">{{ metrics.pendingVerifications }}</p>
              <p class="metric-label">Pending Verifications</p>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <div class="actions-grid">
            <button mat-stroked-button routerLink="/admin/users">
              <mat-icon>manage_accounts</mat-icon> User Management
            </button>
            <button mat-stroked-button routerLink="/admin/verification">
              <mat-icon>verified_user</mat-icon> Provider Verification
            </button>
            <button mat-stroked-button routerLink="/admin/disputes">
              <mat-icon>gavel</mat-icon> Disputes
            </button>
            <button mat-stroked-button routerLink="/admin/reports">
              <mat-icon>assessment</mat-icon> Reports
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container { padding: 16px; max-width: 1200px; margin: 0 auto; }
    h2 { font-weight: 600; margin-bottom: 24px; }
    h3 { font-weight: 600; margin: 24px 0 12px; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .metric-card { text-align: center; }
    .metric-card mat-icon { font-size: 32px; width: 32px; height: 32px; color: #06C167; }
    .metric-value { font-size: 2rem; font-weight: 700; margin: 8px 0 4px; }
    .metric-label { color: #666; font-size: 0.875rem; }
    .metric-card.highlight { border-left: 3px solid #e65100; }
    .metric-card.highlight mat-icon { color: #e65100; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .actions-grid button { height: 48px; justify-content: flex-start; gap: 8px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  metrics = { totalUsers: 0, activeProviders: 0, dailyBookings: 0, totalRevenue: 0, pendingVerifications: 0 };
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe({
      next: (data) => { this.metrics = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
