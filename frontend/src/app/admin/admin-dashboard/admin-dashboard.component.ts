import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
        <p>Loading dashboard...</p>
      </div>

      <div *ngIf="!loading" class="dashboard-content">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon users-icon">👥</div>
            <div class="metric-value">{{ metrics.totalUsers }}</div>
            <div class="metric-label">Total Users</div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">🔧</div>
            <div class="metric-value">{{ metrics.activeProviders }}</div>
            <div class="metric-label">Active Providers</div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">📋</div>
            <div class="metric-value">{{ metrics.dailyBookings }}</div>
            <div class="metric-label">Today's Bookings</div>
          </div>
          <div class="metric-card">
            <div class="metric-icon">💰</div>
            <div class="metric-value">R{{ metrics.totalRevenue }}</div>
            <div class="metric-label">Total Revenue</div>
          </div>
          <div class="metric-card pending">
            <div class="metric-icon">⏳</div>
            <div class="metric-value">{{ metrics.pendingVerifications }}</div>
            <div class="metric-label">Pending Verifications</div>
          </div>
        </div>

        <h3>Manage</h3>
        <div class="actions-grid">
          <a class="action-btn" routerLink="/admin/users">👥 User Management</a>
          <a class="action-btn" routerLink="/admin/verification">✅ Provider Verification</a>
          <a class="action-btn" routerLink="/admin/disputes">⚖️ Disputes</a>
          <a class="action-btn" routerLink="/admin/reports">📊 Reports</a>
        </div>
      </div>

      <div *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</div>
    </div>
  `,
  styles: [`
    .admin-container { padding: 24px 20px; max-width: 1000px; margin: 0 auto; }
    h2 { font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 1.6rem; margin: 0 0 24px; }
    h3 { font-weight: 600; margin: 28px 0 12px; font-size: 1.1rem; }
    .loading { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #666; }
    .dashboard-content { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
    .metric-card {
      text-align: center; padding: 20px 12px; border-radius: 12px; border: 1px solid #eee;
      background: #fff; transition: all 0.2s ease;
    }
    .metric-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.06); border-color: #06C167; }
    .metric-card.pending { border-left: 3px solid #e65100; }
    .metric-icon { font-size: 1.8rem; margin-bottom: 8px; }
    .metric-value { font-family: 'Poppins', sans-serif; font-size: 1.8rem; font-weight: 700; }
    .metric-label { color: #666; font-size: 0.8rem; margin-top: 2px; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .action-btn {
      display: block; padding: 14px 16px; border-radius: 10px; border: 1px solid #eee;
      text-decoration: none; color: #333; font-weight: 500; font-size: 0.9rem;
      transition: all 0.2s ease; cursor: pointer;
    }
    .action-btn:hover { border-color: #06C167; background: #f8fffe; transform: translateY(-2px); }
    .error-msg { background: #fdecea; color: #d32f2f; padding: 12px; border-radius: 8px; margin-top: 16px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  metrics = { totalUsers: 0, activeProviders: 0, dailyBookings: 0, totalRevenue: 0, pendingVerifications: 0 };
  loading = true;
  errorMsg = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard`).subscribe({
      next: (data) => {
        this.metrics = data;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (err) => {
        this.errorMsg = 'Failed to load dashboard: ' + (err.error?.message || err.message);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
