import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatInputModule, MatButtonModule,
    MatFormFieldModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card card-elevated">
        <mat-card-header>
          <mat-card-title>Change Password</mat-card-title>
          <mat-card-subtitle>Enter your email and set a new password</mat-card-subtitle>
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
            <form [formGroup]="changeForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email">
                @if (changeForm.get('email')?.hasError('required') && changeForm.get('email')?.touched) {
                  <mat-error>Email is required</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Current Password</mat-label>
                <input matInput formControlName="currentPassword" type="password">
                @if (changeForm.get('currentPassword')?.hasError('required') && changeForm.get('currentPassword')?.touched) {
                  <mat-error>Current password is required</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput formControlName="newPassword" type="password">
                @if (changeForm.get('newPassword')?.hasError('required') && changeForm.get('newPassword')?.touched) {
                  <mat-error>New password is required</mat-error>
                }
                @if (changeForm.get('newPassword')?.hasError('minlength') && changeForm.get('newPassword')?.touched) {
                  <mat-error>Must be at least 8 characters</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input matInput formControlName="confirmPassword" type="password">
                @if (changeForm.hasError('passwordMismatch') && changeForm.get('confirmPassword')?.touched) {
                  <mat-error>Passwords do not match</mat-error>
                }
              </mat-form-field>
              <button mat-flat-button class="btn-action full-width submit-btn" type="submit"
                      [disabled]="loading || changeForm.invalid">
                @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Change Password }
              </button>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 16px; }
    .auth-card { width: 100%; max-width: 420px; padding: 24px; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 8px; height: 48px; font-size: 16px; }
    .error-banner { background: #fdecea; color: #d32f2f; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
    .success-banner { background: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  `]
})
export class ForgotPasswordComponent {
  changeForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.changeForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPass = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return newPass && confirm && newPass !== confirm ? { passwordMismatch: true } : null;
  }

  onSubmit(): void {
    if (this.changeForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    const { email, currentPassword, newPassword } = this.changeForm.value;

    this.http.post<any>(`${environment.apiUrl}/auth/change-password`, {
      email, currentPassword, newPassword
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Password changed successfully!';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to change password.';
      }
    });
  }
}
