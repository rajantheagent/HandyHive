import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-booking-request-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatListModule],
  template: `
    <div class="requests-container">
      <h2>Incoming Requests</h2>
      <mat-card class="card-elevated">
        <mat-card-content>
          <p>No pending requests</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .requests-container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    h2 { font-weight: 600; margin-bottom: 16px; }
  `]
})
export class BookingRequestListComponent {}
