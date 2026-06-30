import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
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
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card card-elevated">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Join HandyHive today</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (errorMessage) {
            <div class="error-banner">{{ errorMessage }}</div>
          }
          @if (successMessage) {
            <div class="success-banner">{{ successMessage }}</div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" autocomplete="name">
              @if (registerForm.get('full_name')?.hasError('required') && registerForm.get('full_name')?.touched) {
                <mat-error>Full name is required</mat-error>
              }
              @if (registerForm.get('full_name')?.hasError('minlength') && registerForm.get('full_name')?.touched) {
                <mat-error>Must be at least 2 characters</mat-error>
              }
              @if (registerForm.get('full_name')?.hasError('maxlength') && registerForm.get('full_name')?.touched) {
                <mat-error>Must be at most 100 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email">
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                <mat-error>Must be a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" autocomplete="new-password">
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('password')?.hasError('passwordStrength') && registerForm.get('password')?.touched) {
                <mat-error>{{ registerForm.get('password')?.getError('passwordStrength') }}</mat-error>
              }
            </mat-form-field>

            <!-- Password strength indicator -->
            @if (registerForm.get('password')?.value) {
              <div class="password-strength">
                <div class="strength-item" [class.valid]="hasUppercase">✓ Uppercase letter</div>
                <div class="strength-item" [class.valid]="hasLowercase">✓ Lowercase letter</div>
                <div class="strength-item" [class.valid]="hasDigit">✓ Digit</div>
                <div class="strength-item" [class.valid]="hasSpecial">✓ Special character</div>
                <div class="strength-item" [class.valid]="hasMinLength">✓ 8+ characters</div>
              </div>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput formControlName="confirmPassword" [type]="hidePassword ? 'password' : 'text'" autocomplete="new-password">
              @if (registerForm.get('confirmPassword')?.hasError('required') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Please confirm your password</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone (optional)</mat-label>
              <input matInput formControlName="phone" type="tel" placeholder="+1234567890" autocomplete="tel">
              @if (registerForm.get('phone')?.hasError('pattern') && registerForm.get('phone')?.touched) {
                <mat-error>Must be E.164 format (e.g., +1234567890)</mat-error>
              }
            </mat-form-field>

            <mat-checkbox formControlName="terms" class="terms-checkbox">
              I agree to the Terms of Service and Privacy Policy
            </mat-checkbox>

            <button mat-flat-button class="btn-action full-width submit-btn" type="submit"
                    [disabled]="loading || registerForm.invalid || !registerForm.get('terms')?.value">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Create Account
              }
            </button>
          </form>

          <div class="login-link">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
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
    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }
    .full-width { width: 100%; }
    .submit-btn {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
    }
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
    }
    .password-strength {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #999;
    }
    .strength-item.valid { color: #06C167; }
    .terms-checkbox { margin-bottom: 8px; font-size: 14px; }
    .login-link {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: #666;
    }
    .login-link a { color: #06C167; text-decoration: none; font-weight: 500; }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
      terms: [false]
    }, { validators: this.passwordMatchValidator });
  }

  get hasUppercase(): boolean { return /[A-Z]/.test(this.registerForm.get('password')?.value || ''); }
  get hasLowercase(): boolean { return /[a-z]/.test(this.registerForm.get('password')?.value || ''); }
  get hasDigit(): boolean { return /[0-9]/.test(this.registerForm.get('password')?.value || ''); }
  get hasSpecial(): boolean { return /[!@#$%^&*()\-_+=]/.test(this.registerForm.get('password')?.value || ''); }
  get hasMinLength(): boolean { return (this.registerForm.get('password')?.value || '').length >= 8; }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*()\-_+=]/.test(value);
    const hasLength = value.length >= 8 && value.length <= 128;

    if (!hasLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return { passwordStrength: 'Password does not meet all requirements' };
    }
    return null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { full_name, email, password, phone } = this.registerForm.value;
    const dto = { full_name, email, password, phone: phone || undefined };

    this.authService.register(dto).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message;
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.details && Array.isArray(err.error.details)) {
          this.errorMessage = err.error.details.map((d: any) => `${d.field}: ${d.message}`).join('; ');
        } else {
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}
