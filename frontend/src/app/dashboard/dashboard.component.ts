import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard">
      <div class="welcome-section">
        <h1>Welcome back, <span class="highlight">{{ userName }}</span> 👋</h1>
        <p>What can we help you with today?</p>
      </div>

      <div class="quick-actions">
        <a class="action-card" routerLink="/map">
          <mat-icon>search</mat-icon>
          <h3>Find a Service</h3>
          <p>Browse providers near you on the map</p>
        </a>
        <a class="action-card" routerLink="/booking/history">
          <mat-icon>history</mat-icon>
          <h3>My Bookings</h3>
          <p>View your booking history and status</p>
        </a>
        <a class="action-card" routerLink="/provider/register">
          <mat-icon>handyman</mat-icon>
          <h3>Become a Provider</h3>
          <p>Start earning by offering your services</p>
        </a>
      </div>

      <div class="recent-section">
        <h2>Quick Links</h2>
        <div class="links-grid">
          <a mat-stroked-button routerLink="/map"><mat-icon>place</mat-icon> Explore Map</a>
          <a mat-stroked-button routerLink="/auth/forgot-password"><mat-icon>lock_reset</mat-icon> Change Password</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 32px 20px; max-width: 900px; margin: 0 auto; }
    .welcome-section { margin-bottom: 32px; }
    .welcome-section h1 { font-family: 'Poppins', sans-serif; font-size: 1.8rem; font-weight: 700; margin: 0 0 4px; }
    .welcome-section p { color: #666; font-size: 1rem; margin: 0; }
    .highlight { color: #06C167; }
    .quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .action-card {
      display: block; text-decoration: none; color: inherit; padding: 24px; border-radius: 12px;
      border: 1px solid #eee; transition: all 0.25s ease; cursor: pointer;
    }
    .action-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(6,193,103,0.1); border-color: #06C167; }
    .action-card mat-icon { font-size: 32px; width: 32px; height: 32px; color: #06C167; margin-bottom: 12px; }
    .action-card h3 { font-size: 1rem; font-weight: 600; margin: 0 0 4px; }
    .action-card p { font-size: 0.82rem; color: #666; margin: 0; }
    .recent-section h2 { font-size: 1.1rem; font-weight: 600; margin: 0 0 12px; }
    .links-grid { display: flex; gap: 12px; flex-wrap: wrap; }
    .links-grid a { border-radius: 8px !important; text-decoration: none; }
  `]
})
export class DashboardComponent implements OnInit {
  userName = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const token = this.authService.getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.fullName || payload.email?.split('@')[0] || 'User';
      } catch { this.userName = 'User'; }
    }
  }
}
