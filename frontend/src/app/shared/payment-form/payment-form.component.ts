import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="payment-card card-elevated">
      <mat-card-header>
        <mat-card-title>Payment</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <!-- Price estimate -->
        @if (estimatedCost > 0) {
          <div class="price-estimate">
            <div class="estimate-row">
              <span>Service cost</span>
              <span>R{{ estimatedCost | number:'1.2-2' }}</span>
            </div>
            <div class="estimate-row">
              <span>Service fees</span>
              <span>R{{ serviceFees | number:'1.2-2' }}</span>
            </div>
            <div class="estimate-row total">
              <span>Total</span>
              <strong>R{{ totalAmount | number:'1.2-2' }}</strong>
            </div>
          </div>
        }

        <!-- Payment method selection -->
        <form [formGroup]="paymentForm">
          <h4>Payment Method</h4>
          <mat-radio-group formControlName="method" class="payment-options">
            <mat-radio-button value="credit_card">
              <mat-icon>credit_card</mat-icon> Credit Card
            </mat-radio-button>
            <mat-radio-button value="debit_card">
              <mat-icon>credit_card</mat-icon> Debit Card
            </mat-radio-button>
            <mat-radio-button value="upi">
              <mat-icon>phone_android</mat-icon> UPI
            </mat-radio-button>
            <mat-radio-button value="digital_wallet">
              <mat-icon>account_balance_wallet</mat-icon> Digital Wallet
            </mat-radio-button>
          </mat-radio-group>

          <!-- Stripe card element placeholder -->
          @if (paymentForm.get('method')?.value === 'credit_card' || paymentForm.get('method')?.value === 'debit_card') {
            <div class="card-element-container">
              <div id="card-element" class="card-element">
                <!-- Stripe Elements will mount here in production -->
                <p class="placeholder-text">Card details powered by Stripe</p>
              </div>
            </div>
          }
        </form>

        @if (errorMessage) {
          <div class="error-banner">{{ errorMessage }}</div>
        }

        @if (retryCount > 0) {
          <p class="retry-info">Attempt {{ retryCount }}/3</p>
        }

        <button mat-flat-button class="btn-action full-width pay-btn"
                (click)="processPayment()"
                [disabled]="loading || !paymentForm.get('method')?.value">
          @if (loading) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Pay R{{ totalAmount | number:'1.2-2' }}
          }
        </button>

        <p class="security-note">
          <mat-icon>lock</mat-icon>
          Payments are secured by Stripe. We never store your card details.
        </p>
      </mat-card-content>
    </mat-card>

    <!-- Receipt display -->
    @if (receipt) {
      <mat-card class="receipt-card card-elevated">
        <mat-card-header>
          <mat-card-title>Payment Confirmed</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="receipt-details">
            <div class="receipt-row"><span>Amount</span><strong>R{{ receipt.amount | number:'1.2-2' }}</strong></div>
            <div class="receipt-row"><span>Method</span><span>{{ receipt.method }}</span></div>
            <div class="receipt-row"><span>Reference</span><span>{{ receipt.id }}</span></div>
            <div class="receipt-row"><span>Date</span><span>{{ receipt.paid_at | date:'medium' }}</span></div>
          </div>
          <mat-icon class="success-icon">check_circle</mat-icon>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .payment-card { margin: 16px 0; }
    .price-estimate { margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px; }
    .estimate-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.9rem; }
    .estimate-row.total { border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 8px; font-size: 1rem; }
    h4 { margin: 16px 0 8px; font-weight: 600; }
    .payment-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .payment-options mat-radio-button { display: flex; align-items: center; }
    .payment-options mat-icon { margin-right: 8px; font-size: 18px; width: 18px; height: 18px; }
    .card-element-container { margin: 16px 0; }
    .card-element { border: 1px solid #ccc; border-radius: 8px; padding: 12px; min-height: 48px; }
    .placeholder-text { color: #999; font-size: 0.85rem; margin: 0; }
    .full-width { width: 100%; }
    .pay-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .error-banner { background: #fdecea; color: #d32f2f; padding: 12px; border-radius: 8px; margin: 12px 0; }
    .retry-info { color: #e65100; font-size: 0.85rem; }
    .security-note { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #999; margin-top: 12px; justify-content: center; }
    .security-note mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .receipt-card { margin: 16px 0; text-align: center; }
    .receipt-details { text-align: left; }
    .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .success-icon { font-size: 48px; width: 48px; height: 48px; color: #06C167; margin-top: 16px; }
  `]
})
export class PaymentFormComponent {
  @Input() bookingId = '';
  @Input() estimatedCost = 0;
  @Input() serviceFees = 0;
  @Output() paymentCompleted = new EventEmitter<any>();

  paymentForm: FormGroup;
  loading = false;
  errorMessage = '';
  retryCount = 0;
  receipt: any = null;

  get totalAmount(): number {
    return this.estimatedCost + this.serviceFees;
  }

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.paymentForm = this.fb.group({
      method: ['credit_card'],
    });
  }

  processPayment(): void {
    this.loading = true;
    this.errorMessage = '';

    const method = this.paymentForm.get('method')?.value;

    this.http.post<any>(`${environment.apiUrl}/payments/intent`, {
      bookingId: this.bookingId,
      amount: this.totalAmount,
      method,
    }).subscribe({
      next: (result) => {
        // In production, confirm with Stripe.js client-side
        // For now, auto-confirm the payment
        this.confirmPayment(result.payment.id);
      },
      error: (err) => {
        this.loading = false;
        this.retryCount++;
        if (this.retryCount >= 3) {
          this.errorMessage = 'Payment failed after 3 attempts. Please try again later.';
        } else {
          this.errorMessage = err.error?.message || 'Payment failed. Please try again.';
        }
      }
    });
  }

  private confirmPayment(paymentId: string): void {
    this.http.post<any>(`${environment.apiUrl}/payments/${paymentId}/confirm`, {}).subscribe({
      next: (payment) => {
        this.loading = false;
        this.receipt = payment;
        this.paymentCompleted.emit(payment);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Payment confirmation failed';
      }
    });
  }
}
