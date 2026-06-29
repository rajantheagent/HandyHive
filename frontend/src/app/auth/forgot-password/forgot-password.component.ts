import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card card-elevated">
        <mat-card-header>
          <mat-card-title>Reset Password</mat-card-title>
          <mat-card-subtitle>Enter your email to receive a reset link</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (successMessage) {
            <div class="success-banner">
              <mat-icon>check_circle</mat-icon>
              {{ successMessage }}
            </div>
          }

          @if (errorMessage) {
            <div class="error-banner">{{ errorMessage }}</div>
          }

          @if (!successMessage) {
            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" autocomplete="email">
                @if (forgotForm.get('email')?.hasError('required') && forgotForm.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
                @if (forgotForm.get('email')?.hasError('email') && forgotForm.get('email')?.touched) {
                  <mat-error>Must be a valid email</mat-error>
                }
              </mat-form-field>

              <button mat-flat-button class="btn-action full-width submit-btn" type="submit"
                      [disabled]="loading || forgotForm.invalid">
                @if (loading) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Send Reset Link
                }
              </button>
            </form>
          }

          <div class="back-link">
            <a routerLink="/auth/login">
              <mat-icon>arrow_back</mat-icon>
              Back to Sign In
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 16px;
    }
    .auth-card { width: 100%; max-width: 400px; padding: 24px; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 8px; height: 48px; font-size: 16px; }
    .error-banner {
      background-color: #fdecea;
      color: #d32f2f;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    .success-banner {
      background-color: #e8f5e9;
      color: #2e7d32;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .back-link {
      text-align: center;
      margin-top: 24px;
    }
    .back-link a {
      color: #06C167;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }
  `]
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { email } = this.forgotForm.value;
    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }
}
