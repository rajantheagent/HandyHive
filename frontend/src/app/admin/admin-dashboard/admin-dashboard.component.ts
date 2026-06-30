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

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="32"></mat-spinner>
      </div>

      <div *ngIf="!loading">
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
              <p class="metric-value">R{{ metrics.totalRevenue }}</p>
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

        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <a mat-stroked-button routerLink="/admin/users">
            <mat-icon>manage_accounts</mat-icon> User Management
          </a>
          <a mat-stroked-button routerLink="/admin/verification">
            <mat-icon>verified_user</mat-icon> Provider Verification
          </a>
          <a mat-stroked-button routerLink="/admin/disputes">
            <mat-icon>gavel</mat-icon> Disputes
          </a>
          <a mat-stroked-button routerLink="/admin/reports">
            <mat-icon>assessment</mat-icon> Reports
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 24px 20px; max-width: 1100px; margin: 0 auto; }
    h2 { font-family: 'Poppins', sans-serif; font-weight: 700; margin: 0 0 24px; }
    h3 { font-weight: 600; margin: 32px 0 12px; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .metric-card { text-align: center; padding: 8px; }
    .metric-card mat-icon { font-size: 28px; width: 28px; height: 28px; color: #06C167; }
    .metric-value { font-size: 1.8rem; font-weight: 700; margin: 8px 0 2px; }
    .metric-label { color: #666; font-size: 0.82rem; margin: 0; }
    .metric-card.highlight { border-left: 3px solid #e65100; }
    .metric-card.highlight mat-icon { color: #e65100; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .actions-grid a { height: 48px; display: flex; align-items: center; gap: 8px; text-decoration: none; border-radius: 8px !important; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  metrics = { totalUsers: 0, activeProviders: 0, dailyBookings: 0, totalRevenue: 0, pendingVerifications: 0 };
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log('[AdminDashboard] Loading...');
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe({
      next: (data) => {
        console.log('[AdminDashboard] Success:', data);
        this.metrics = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('[AdminDashboard] Error:', err);
        this.loading = false;
      }
    });
  }
}
