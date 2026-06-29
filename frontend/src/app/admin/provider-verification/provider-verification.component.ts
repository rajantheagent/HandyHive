import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-provider-verification',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatListModule],
  template: `
    <div class="verification-container">
      <h2>Provider Verification</h2>
      <mat-card class="card-elevated">
        <mat-card-content>
          <p>No pending verifications</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .verification-container {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h2 { font-weight: 600; margin-bottom: 16px; }
  `]
})
export class ProviderVerificationComponent {}
