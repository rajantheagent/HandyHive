import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <a routerLink="/admin" class="back-link"><span>← Back to Admin Dashboard</span></a>
      <h2>User Management</h2>

      <div class="search-box">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search by name or email..." (keyup.enter)="search()">
        <button class="search-btn" (click)="search()">Search</button>
      </div>

      <div *ngIf="loading" class="loading"><mat-spinner diameter="24"></mat-spinner></div>

      <div *ngIf="!loading && users.length > 0">
        <h3>Users ({{ users.length }})</h3>
        <div class="user-list">
          <div *ngFor="let user of users" class="user-row">
            <div class="user-avatar">{{ user.full_name?.charAt(0) || '?' }}</div>
            <div class="user-info">
              <strong>{{ user.full_name }}</strong>
              <span>{{ user.email }}</span>
              <span class="role-badge">{{ user.role }}</span>
            </div>
            <button class="suspend-btn" (click)="suspendUser(user.id)">Suspend</button>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && providers.length > 0">
        <h3>Providers ({{ providers.length }})</h3>
        <div class="user-list">
          <div *ngFor="let p of providers" class="user-row">
            <div class="user-avatar prov">{{ p.full_name?.charAt(0) || '?' }}</div>
            <div class="user-info">
              <strong>{{ p.full_name }}</strong>
              <span>{{ p.email }} · Status: {{ p.status }}</span>
            </div>
            <button class="suspend-btn" (click)="suspendUser(p.id)">Suspend</button>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && users.length === 0 && providers.length === 0 && searched" class="empty">
        <p>No users found for "{{ searchQuery }}"</p>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 20px; max-width: 900px; margin: 0 auto; }
    .back-link { color: #06C167; text-decoration: none; font-size: 0.85rem; display: inline-block; margin-bottom: 16px; }
    .back-link:hover { text-decoration: underline; }
    h2 { font-family: 'Poppins', sans-serif; font-weight: 700; margin: 0 0 16px; }
    h3 { font-weight: 600; margin: 20px 0 10px; font-size: 0.95rem; color: #666; }
    .search-box { display: flex; gap: 8px; margin-bottom: 20px; }
    .search-box input { flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem; }
    .search-btn { padding: 10px 20px; background: #06C167; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .loading { padding: 24px; text-align: center; }
    .user-list { display: flex; flex-direction: column; gap: 8px; }
    .user-row { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 10px; }
    .user-row:hover { border-color: #06C167; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: #06C167; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .user-avatar.prov { background: #FFB800; }
    .user-info { flex: 1; }
    .user-info strong { display: block; font-size: 0.9rem; }
    .user-info span { font-size: 0.78rem; color: #666; }
    .role-badge { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 8px; }
    .suspend-btn { padding: 6px 12px; background: #fff; border: 1px solid #d32f2f; color: #d32f2f; border-radius: 6px; cursor: pointer; font-size: 0.78rem; }
    .suspend-btn:hover { background: #fdecea; }
    .empty { text-align: center; padding: 32px; color: #888; }
  `]
})
export class UserManagementComponent implements OnInit {
  searchQuery = '';
  users: any[] = [];
  providers: any[] = [];
  loading = false;
  searched = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.searchQuery = 'a'; // Search all by default
    this.search();
  }

  search(): void {
    if (!this.searchQuery.trim()) return;
    this.loading = true;
    this.searched = true;
    this.http.get<any>(`${environment.apiUrl}/admin/search`, { params: { q: this.searchQuery } }).subscribe({
      next: (data) => {
        this.users = data.users || [];
        this.providers = data.providers || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  suspendUser(id: string): void {
    const reason = prompt('Enter reason for suspension (min 10 chars):');
    if (!reason || reason.length < 10) { alert('Reason must be at least 10 characters'); return; }
    this.http.post(`${environment.apiUrl}/admin/users/${id}/suspend`, { reason, targetType: 'user', action: 'suspend' }).subscribe({
      next: () => { alert('User suspended'); this.search(); },
      error: (err) => { alert(err.error?.message || 'Failed'); }
    });
  }
}
