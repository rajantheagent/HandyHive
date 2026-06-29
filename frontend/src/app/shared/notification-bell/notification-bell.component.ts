import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil, interval } from 'rxjs';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  booking_ref: string | null;
}

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatListModule,
    MatDividerModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="bell-btn"
            [matBadge]="unreadCount > 0 ? unreadCount : null"
            matBadgeColor="accent" matBadgeSize="small">
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #notifMenu="matMenu" class="notification-menu">
      <div class="menu-header" (click)="$event.stopPropagation()">
        <span class="menu-title">Notifications</span>
        @if (unreadCount > 0) {
          <button mat-button class="mark-all-btn" (click)="markAllRead()">Mark all read</button>
        }
      </div>
      <mat-divider></mat-divider>

      @if (notifications.length === 0) {
        <div class="empty-state" (click)="$event.stopPropagation()">
          <mat-icon>notifications_none</mat-icon>
          <p>No notifications</p>
        </div>
      } @else {
        @for (notif of notifications; track notif.id) {
          <button mat-menu-item class="notif-item" [class.unread]="!notif.is_read"
                  (click)="onNotificationClick(notif)">
            <div class="notif-content">
              <span class="notif-title">{{ notif.title }}</span>
              <span class="notif-body">{{ notif.body }}</span>
              <span class="notif-time">{{ getTimeAgo(notif.created_at) }}</span>
            </div>
            @if (!notif.is_read) {
              <div class="unread-dot"></div>
            }
          </button>
        }
        <mat-divider></mat-divider>
        <button mat-menu-item class="view-all-btn" (click)="viewAll()">
          View all notifications
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .bell-btn { position: relative; }
    .menu-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; }
    .menu-title { font-weight: 600; font-size: 1rem; }
    .mark-all-btn { font-size: 0.75rem; color: #06C167; }
    .empty-state { text-align: center; padding: 24px; color: #999; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .notif-item { height: auto !important; padding: 12px 16px !important; white-space: normal !important; }
    .notif-item.unread { background: #f8fffe; }
    .notif-content { display: flex; flex-direction: column; gap: 2px; max-width: 280px; }
    .notif-title { font-weight: 600; font-size: 0.85rem; }
    .notif-body { font-size: 0.8rem; color: #666; overflow: hidden; text-overflow: ellipsis; }
    .notif-time { font-size: 0.7rem; color: #999; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #06C167; margin-left: 8px; flex-shrink: 0; }
    .view-all-btn { text-align: center; color: #06C167; font-size: 0.85rem; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadNotifications();
    // Poll every 30 seconds
    interval(30000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.http.get<any>(`${environment.apiUrl}/notifications`, { params: { page: '1' } }).subscribe({
      next: (result) => {
        this.notifications = result.notifications?.slice(0, 10) || [];
        this.unreadCount = result.unreadCount || 0;
      },
      error: () => {}
    });
  }

  onNotificationClick(notif: NotificationItem): void {
    if (!notif.is_read) {
      this.http.patch(`${environment.apiUrl}/notifications/${notif.id}/read`, {}).subscribe();
      notif.is_read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }

    if (notif.booking_ref) {
      // Navigate to booking if linked
      this.router.navigate(['/booking/history']);
    }
  }

  markAllRead(): void {
    this.http.post(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        this.notifications.forEach(n => n.is_read = true);
        this.unreadCount = 0;
      }
    });
  }

  viewAll(): void {
    this.router.navigate(['/notifications']);
  }

  getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
