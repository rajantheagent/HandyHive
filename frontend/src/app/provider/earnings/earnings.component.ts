import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { environment } from '../../../environments/environment';

interface EarningsData {
  total: number;
  breakdown: { date: string; amount: number }[];
}

@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTabsModule, MatIconModule, MatProgressSpinnerModule, MatListModule],
  template: `
    <div class="earnings-container">
      <h2>Earnings</h2>

      <!-- Total earnings card -->
      <mat-card class="total-card card-elevated">
        <mat-card-content>
          <div class="total-display">
            <span class="total-label">Total Earnings</span>
            <span class="total-amount">R{{ currentData?.total | number:'1.2-2' }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Period tabs -->
      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab label="Daily (30 days)">
          <ng-template matTabContent>
            @if (loading) {
              <div class="loading-state"><mat-spinner diameter="24"></mat-spinner></div>
            } @else {
              <ng-container *ngTemplateOutlet="breakdownList"></ng-container>
            }
          </ng-template>
        </mat-tab>
        <mat-tab label="Weekly (12 weeks)">
          <ng-template matTabContent>
            @if (loading) {
              <div class="loading-state"><mat-spinner diameter="24"></mat-spinner></div>
            } @else {
              <ng-container *ngTemplateOutlet="breakdownList"></ng-container>
            }
          </ng-template>
        </mat-tab>
        <mat-tab label="Monthly (12 months)">
          <ng-template matTabContent>
            @if (loading) {
              <div class="loading-state"><mat-spinner diameter="24"></mat-spinner></div>
            } @else {
              <ng-container *ngTemplateOutlet="breakdownList"></ng-container>
            }
          </ng-template>
        </mat-tab>
      </mat-tab-group>

      <ng-template #breakdownList>
        @if (currentData && currentData.breakdown.length > 0) {
          <div class="breakdown-list">
            @for (item of currentData.breakdown; track item.date) {
              <div class="breakdown-row">
                <span class="breakdown-date">{{ item.date | date:'mediumDate' }}</span>
                <span class="breakdown-amount">R{{ item.amount | number:'1.2-2' }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>account_balance_wallet</mat-icon>
            <p>No earnings for this period</p>
          </div>
        }
      </ng-template>
    </div>
  `,
  styles: [`
    .earnings-container { padding: 16px; max-width: 800px; margin: 0 auto; }
    h2 { font-weight: 600; margin-bottom: 16px; }
    .total-card { margin-bottom: 24px; background: linear-gradient(135deg, #000 0%, #333 100%); color: white; }
    .total-display { text-align: center; padding: 16px; }
    .total-label { display: block; font-size: 0.875rem; opacity: 0.8; margin-bottom: 4px; }
    .total-amount { font-size: 2.5rem; font-weight: 700; }
    .loading-state { display: flex; justify-content: center; padding: 32px; }
    .breakdown-list { margin-top: 16px; }
    .breakdown-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .breakdown-date { color: #666; }
    .breakdown-amount { font-weight: 600; }
    .empty-state { text-align: center; padding: 32px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `]
})
export class EarningsComponent implements OnInit {
  currentData: EarningsData | null = null;
  loading = false;
  private periods: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
  private currentPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadEarnings();
  }

  onTabChange(index: number): void {
    this.currentPeriod = this.periods[index];
    this.loadEarnings();
  }

  private loadEarnings(): void {
    this.loading = true;
    this.http.get<EarningsData>(`${environment.apiUrl}/payments/earnings`, {
      params: { period: this.currentPeriod }
    }).subscribe({
      next: (data) => {
        this.currentData = data;
        this.loading = false;
      },
      error: () => {
        this.currentData = { total: 0, breakdown: [] };
        this.loading = false;
      }
    });
  }
}
