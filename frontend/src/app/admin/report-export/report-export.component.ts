import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-report-export',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatTableModule],
  template: `
    <div class="reports-container">
      <h2>Reports</h2>

      <mat-card class="card-elevated">
        <mat-card-content>
          <div class="report-filters">
            <mat-form-field appearance="outline">
              <mat-label>Report Type</mat-label>
              <mat-select [(ngModel)]="reportType">
                <mat-option value="bookings">Bookings</mat-option>
                <mat-option value="revenue">Revenue</mat-option>
                <mat-option value="users">User Activity</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Period</mat-label>
              <mat-select [(ngModel)]="period">
                <mat-option value="daily">Daily</mat-option>
                <mat-option value="weekly">Weekly</mat-option>
                <mat-option value="monthly">Monthly</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-flat-button class="btn-action" (click)="generateReport()" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Generate
              }
            </button>
          </div>

          @if (reportData.length > 0) {
            <div class="report-actions">
              <button mat-stroked-button (click)="exportCSV()">
                <mat-icon>download</mat-icon> Export CSV
              </button>
            </div>

            <div class="report-preview">
              <p class="report-meta">{{ reportData.length }} records · Generated {{ generatedAt | date:'medium' }}</p>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      @for (col of columns; track col) {
                        <th>{{ col }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of reportData.slice(0, 20); track $index) {
                      <tr>
                        @for (col of columns; track col) {
                          <td>{{ row[col] }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              @if (reportData.length > 20) {
                <p class="more-note">Showing 20 of {{ reportData.length }} records. Export for full data.</p>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reports-container { padding: 16px; max-width: 1200px; margin: 0 auto; }
    h2 { font-weight: 600; margin-bottom: 16px; }
    .report-filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .report-actions { margin: 16px 0; display: flex; gap: 8px; }
    .report-meta { font-size: 0.8rem; color: #666; margin-bottom: 12px; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    .more-note { font-size: 0.8rem; color: #999; margin-top: 8px; }
  `]
})
export class ReportExportComponent {
  reportType = 'bookings';
  period = 'daily';
  reportData: any[] = [];
  columns: string[] = [];
  generatedAt: Date | null = null;
  loading = false;

  constructor(private http: HttpClient) {}

  generateReport(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/admin/reports`, {
      params: { type: this.reportType, period: this.period }
    }).subscribe({
      next: (result) => {
        this.reportData = result.data || [];
        this.generatedAt = new Date(result.generatedAt);
        this.columns = this.reportData.length > 0 ? Object.keys(this.reportData[0]) : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  exportCSV(): void {
    if (this.reportData.length === 0) return;

    const headers = this.columns.join(',');
    const rows = this.reportData.map(row =>
      this.columns.map(col => `"${row[col] ?? ''}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${this.reportType}_${this.period}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
