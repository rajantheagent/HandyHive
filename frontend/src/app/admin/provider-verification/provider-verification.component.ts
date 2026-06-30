import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-provider-verification',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <a routerLink="/admin" class="back-link">← Back to Admin Dashboard</a>
      <h2>Provider Verification</h2>
      <p class="sub">Review and approve pending provider applications</p>

      <div *ngIf="loading" class="loading"><mat-spinner diameter="24"></mat-spinner></div>

      <div *ngIf="!loading && providers.length === 0" class="empty">
        <p>✅ No pending verifications</p>
      </div>

      <div *ngIf="!loading && providers.length > 0" class="provider-list">
        <div *ngFor="let p of providers" class="provider-card">
          <div class="card-header">
            <div class="prov-avatar">{{ p.full_name?.charAt(0) }}</div>
            <div class="prov-info">
              <strong>{{ p.full_name }}</strong>
              <span>{{ p.email }}</span>
            </div>
            <span class="status-badge">{{ p.status }}</span>
          </div>
          <div class="card-details">
            <div class="detail"><strong>Phone:</strong> {{ p.phone }}</div>
            <div class="detail"><strong>Address:</strong> {{ p.address }}</div>
            <div class="detail"><strong>Experience:</strong> {{ p.experience_years }} years</div>
            <div class="detail"><strong>Radius:</strong> {{ p.service_radius_km }} km</div>
            <div class="detail"><strong>Rate:</strong> R{{ p.hourly_rate || 'Not set' }}/hr</div>
            <div *ngIf="p.id_document_url" class="detail">
              <strong>Document:</strong> <a [href]="'http://localhost:3000' + p.id_document_url" target="_blank">View Document</a>
            </div>
          </div>
          <div class="card-actions">
            <button class="approve-btn" (click)="approve(p.id)">✅ Approve</button>
            <button class="reject-btn" (click)="reject(p.id)">❌ Reject</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 20px; max-width: 900px; margin: 0 auto; }
    .back-link { color: #06C167; text-decoration: none; font-size: 0.85rem; display: inline-block; margin-bottom: 16px; }
    h2 { font-family: 'Poppins', sans-serif; font-weight: 700; margin: 0 0 4px; }
    .sub { color: #666; font-size: 0.9rem; margin: 0 0 20px; }
    .loading { padding: 24px; text-align: center; }
    .empty { text-align: center; padding: 48px; color: #06C167; font-size: 1.1rem; }
    .provider-list { display: flex; flex-direction: column; gap: 14px; }
    .provider-card { border: 1px solid #eee; border-radius: 12px; padding: 16px; }
    .provider-card:hover { border-color: #06C167; }
    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .prov-avatar { width: 40px; height: 40px; border-radius: 50%; background: #FFB800; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .prov-info { flex: 1; }
    .prov-info strong { display: block; font-size: 0.95rem; }
    .prov-info span { font-size: 0.8rem; color: #666; }
    .status-badge { background: #fff3e0; color: #e65100; padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; }
    .card-details { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 14px; }
    .detail { font-size: 0.82rem; color: #444; }
    .detail a { color: #06C167; }
    .card-actions { display: flex; gap: 10px; }
    .approve-btn { flex: 1; padding: 10px; background: #06C167; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .approve-btn:hover { background: #05a85a; }
    .reject-btn { flex: 1; padding: 10px; background: white; color: #d32f2f; border: 1px solid #d32f2f; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .reject-btn:hover { background: #fdecea; }
  `]
})
export class ProviderVerificationComponent implements OnInit {
  providers: any[] = [];
  loading = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/providers/pending`).subscribe({
      next: (data) => { this.providers = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.providers = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  approve(id: string): void {
    this.http.post(`${environment.apiUrl}/admin/providers/${id}/approve`, {}).subscribe({
      next: () => { alert('Provider approved!'); this.loadPending(); },
      error: (err) => { alert(err.error?.message || 'Failed to approve'); }
    });
  }

  reject(id: string): void {
    const reason = prompt('Enter rejection reason (min 10 characters):');
    if (!reason || reason.length < 10) { alert('Reason must be at least 10 characters'); return; }
    this.http.post(`${environment.apiUrl}/admin/providers/${id}/reject`, { reason }).subscribe({
      next: () => { alert('Provider rejected'); this.loadPending(); },
      error: (err) => { alert(err.error?.message || 'Failed to reject'); }
    });
  }
}
