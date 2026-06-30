import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dispute-resolution',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="disputes-container">
      <a routerLink="/admin" style="color:#06C167;text-decoration:none;font-size:0.85rem;display:inline-block;margin-bottom:16px">← Back to Admin Dashboard</a>
      <h2>Dispute Resolution</h2>

      @if (disputes.length === 0) {
        <mat-card class="card-elevated empty-state">
          <mat-card-content>
            <mat-icon>gavel</mat-icon>
            <p>No open disputes</p>
          </mat-card-content>
        </mat-card>
      }

      @for (dispute of disputes; track dispute.id) {
        <mat-card class="dispute-card card-elevated">
          <mat-card-content>
            <div class="dispute-header">
              <span class="dispute-id">Dispute #{{ dispute.id.slice(0, 8) }}</span>
              <span class="status-badge">{{ dispute.status }}</span>
            </div>
            <p class="dispute-reason">{{ dispute.reason }}</p>
            <p class="dispute-date">Filed: {{ dispute.created_at | date:'medium' }}</p>

            <div class="resolution-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Resolution</mat-label>
                <mat-select [(ngModel)]="dispute._resolution">
                  <mat-option value="full_refund">Full Refund</mat-option>
                  <mat-option value="partial_refund">Partial Refund</mat-option>
                  <mat-option value="dismissed">Dismiss</mat-option>
                </mat-select>
              </mat-form-field>

              @if (dispute._resolution === 'partial_refund') {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Refund Amount (R)</mat-label>
                  <input matInput type="number" [(ngModel)]="dispute._refundAmount" min="0">
                </mat-form-field>
              }

              <button mat-flat-button class="btn-action" (click)="resolve(dispute)"
                      [disabled]="!dispute._resolution">
                Resolve
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .disputes-container { padding: 16px; max-width: 800px; margin: 0 auto; }
    h2 { font-weight: 600; margin-bottom: 16px; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .dispute-card { margin-bottom: 16px; }
    .dispute-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .dispute-id { font-weight: 600; font-family: monospace; }
    .status-badge { background: #fff3e0; color: #e65100; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .dispute-reason { margin: 8px 0; }
    .dispute-date { font-size: 0.8rem; color: #999; }
    .resolution-form { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
  `]
})
export class DisputeResolutionComponent implements OnInit {
  disputes: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/admin/disputes`).subscribe({
      next: (data) => { this.disputes = data.map(d => ({ ...d, _resolution: '', _refundAmount: 0 })); },
      error: () => {}
    });
  }

  resolve(dispute: any): void {
    const body: any = { resolution: dispute._resolution };
    if (dispute._resolution === 'partial_refund') {
      body.refundAmount = dispute._refundAmount;
    }

    this.http.post(`${environment.apiUrl}/admin/disputes/${dispute.id}/resolve`, body).subscribe({
      next: () => { this.disputes = this.disputes.filter(d => d.id !== dispute.id); }
    });
  }
}
