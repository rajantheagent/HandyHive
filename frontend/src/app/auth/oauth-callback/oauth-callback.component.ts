import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule],
  template: `
    <div class="auth-container">
      @if (errorMessage) {
        <mat-card class="auth-card card-elevated">
          <mat-card-content>
            <div class="error-banner">{{ errorMessage }}</div>
            <p>Redirecting to login...</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-spinner diameter="40"></mat-spinner>
        <p class="loading-text">Completing sign in...</p>
      }
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 16px;
    }
    .auth-card { width: 100%; max-width: 400px; padding: 24px; }
    .loading-text { margin-top: 16px; color: #666; }
    .error-banner {
      background-color: #fdecea;
      color: #d32f2f;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const accessToken = params['accessToken'];
    const refreshToken = params['refreshToken'];
    const error = params['error'];

    if (error) {
      this.errorMessage = 'Authentication failed. Please try again.';
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      return;
    }

    if (accessToken && refreshToken) {
      this.authService.handleOAuthCallback(accessToken, refreshToken);
      this.router.navigate(['/map']);
    } else {
      this.errorMessage = 'Invalid callback parameters.';
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
    }
  }
}
