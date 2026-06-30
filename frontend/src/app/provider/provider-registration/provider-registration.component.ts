import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-provider-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatStepperModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="registration-container">
      <h2>Become a Service Provider</h2>
      <p class="subtitle">Join our network and start earning</p>

      @if (errorMessage) {
        <div class="error-banner">{{ errorMessage }}</div>
      }
      @if (successMessage) {
        <div class="success-banner">{{ successMessage }}</div>
      }

      @if (!successMessage) {
        <mat-card class="card-elevated">
          <mat-card-content>
            <mat-stepper [linear]="true" #stepper>
              <!-- Step 1: Personal Info (only for non-logged-in users) -->
              @if (!isLoggedIn) {
              <mat-step [stepControl]="personalForm">
                <ng-template matStepLabel>Personal Info</ng-template>
                <form [formGroup]="personalForm">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="full_name">
                    @if (personalForm.get('full_name')?.hasError('required') && personalForm.get('full_name')?.touched) {
                      <mat-error>Required</mat-error>
                    }
                    @if (personalForm.get('full_name')?.hasError('minlength')) {
                      <mat-error>At least 2 characters</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" type="email">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Phone</mat-label>
                    <input matInput formControlName="phone" placeholder="+27123456789">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Password</mat-label>
                    <input matInput formControlName="password" type="password">
                  </mat-form-field>

                  <div class="step-actions">
                    <button mat-flat-button class="btn-action" matStepperNext [disabled]="personalForm.invalid">Next</button>
                  </div>
                </form>
              </mat-step>
              }

              <!-- Step 2: Service Details -->
              <mat-step [stepControl]="serviceForm">
                <ng-template matStepLabel>Service Details</ng-template>
                <form [formGroup]="serviceForm">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Address</mat-label>
                    <input matInput formControlName="address">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Service Categories (1-5)</mat-label>
                    <mat-select formControlName="category_ids" multiple>
                      @for (cat of categories; track cat.id) {
                        <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                      }
                    </mat-select>
                    @if (serviceForm.get('category_ids')?.hasError('required')) {
                      <mat-error>Select at least 1 category</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Experience (years)</mat-label>
                    <input matInput formControlName="experience_years" type="number" min="0" max="50">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Service Radius (km)</mat-label>
                    <input matInput formControlName="service_radius_km" type="number" min="1" max="50">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Hourly Rate (R)</mat-label>
                    <input matInput formControlName="hourly_rate" type="number" min="0">
                  </mat-form-field>

                  <div class="step-actions">
                    <button mat-stroked-button matStepperPrevious>Back</button>
                    <button mat-flat-button class="btn-action" matStepperNext [disabled]="serviceForm.invalid">Next</button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 3: Document Upload -->
              <mat-step>
                <ng-template matStepLabel>Documents</ng-template>
                <div class="upload-section">
                  <p>Upload your ID document (JPEG, PNG, or PDF, max 5 MB)</p>
                  <input type="file" #fileInput (change)="onFileSelected($event)"
                         accept=".jpg,.jpeg,.png,.pdf" class="file-input">
                  <button mat-stroked-button (click)="fileInput.click()">
                    <mat-icon>upload_file</mat-icon>
                    {{ selectedFileName || 'Choose File' }}
                  </button>
                  @if (fileError) {
                    <p class="file-error">{{ fileError }}</p>
                  }
                </div>

                <div class="step-actions">
                  <button mat-stroked-button matStepperPrevious>Back</button>
                  <button mat-flat-button class="btn-action" (click)="onSubmit()" [disabled]="loading">
                    @if (loading) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      Submit Registration
                    }
                  </button>
                </div>
              </mat-step>
            </mat-stepper>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .registration-container { padding: 16px; max-width: 600px; margin: 0 auto; }
    h2 { font-weight: 600; margin-bottom: 4px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .step-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .error-banner { background: #fdecea; color: #d32f2f; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .success-banner { background: #e8f5e9; color: #2e7d32; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .upload-section { margin: 16px 0; }
    .file-input { display: none; }
    .file-error { color: #d32f2f; font-size: 12px; margin-top: 4px; }
  `]
})
export class ProviderRegistrationComponent implements OnInit {
  personalForm: FormGroup;
  serviceForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  selectedFileName = '';
  fileError = '';
  categories: { id: string; name: string }[] = [];
  isLoggedIn = false;
  userEmail = '';
  userFullName = '';
  userPhone = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private authService: AuthService) {
    this.personalForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+91[6-9]\d{9}|[6-9]\d{9})$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.serviceForm = this.fb.group({
      address: ['', Validators.required],
      category_ids: [[], Validators.required],
      experience_years: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
      service_radius_km: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
      hourly_rate: [null],
    });

    this.loadCategories();
  }

  ngOnInit(): void {
    // If user is logged in, prefill their details and skip personal info step
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      const token = this.authService.getAccessToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.userEmail = payload.email || '';
          this.userFullName = payload.email?.split('@')[0] || '';
          // Prefill the form so it passes validation
          this.personalForm.patchValue({
            full_name: this.userFullName,
            email: this.userEmail,
            phone: '0000000000',
            password: 'prefilled123',
          });
        } catch {}
      }
    }
  }

  loadCategories(): void {
    this.http.get<any[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (cats) => this.categories = cats,
      error: () => {
        // Fallback categories for dev
        this.categories = [
          { id: '1', name: 'Electrician' },
          { id: '2', name: 'Plumber' },
          { id: '3', name: 'Carpenter' },
          { id: '4', name: 'Painter' },
          { id: '5', name: 'Cleaner' },
        ];
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError = '';

    if (file) {
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        this.fileError = 'File must be JPEG, PNG, or PDF';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File must not exceed 5 MB';
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    const formData = new FormData();
    const personal = this.personalForm.value;
    const service = this.serviceForm.value;

    formData.append('full_name', personal.full_name);
    formData.append('email', personal.email);
    formData.append('phone', personal.phone);
    formData.append('password', personal.password);
    formData.append('address', service.address);
    formData.append('experience_years', service.experience_years.toString());
    formData.append('service_radius_km', service.service_radius_km.toString());
    if (service.hourly_rate) formData.append('hourly_rate', service.hourly_rate.toString());

    service.category_ids.forEach((id: string) => formData.append('category_ids', id));

    if (this.selectedFile) {
      formData.append('id_document', this.selectedFile);
    }

    this.http.post(`${environment.apiUrl}/providers/register`, formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.successMessage = response.message;
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.details && Array.isArray(err.error.details)) {
          this.errorMessage = err.error.details.map((d: any) => `${d.field}: ${d.message}`).join('; ');
        } else {
          this.errorMessage = err.error?.message || 'Registration failed';
        }
      }
    });
  }
}
