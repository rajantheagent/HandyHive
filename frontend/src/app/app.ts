import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationBellComponent } from './shared/notification-bell/notification-bell.component';
import { AuthService } from './auth/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatDividerModule,
    NotificationBellComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'HandyHive';
  isLoggedIn = false;
  isAdmin = false;
  userName = '';
  userInitial = '';
  isOnRegisterPage = false;
  isOnLoginPage = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
      if (isAuth) {
        this.loadUserInfo();
      } else {
        this.userName = '';
        this.userInitial = '';
        this.isAdmin = false;
      }
    });

    // Track current route for contextual toolbar buttons
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.isOnRegisterPage = e.url?.includes('/auth/register');
      this.isOnLoginPage = e.url?.includes('/auth/login');
    });
  }

  logout(): void {
    this.authService.logout();
  }

  goHome(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  private loadUserInfo(): void {
    const token = this.authService.getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.email?.split('@')[0] || 'User';
        this.userInitial = this.userName.charAt(0).toUpperCase();
        this.isAdmin = payload.role === 'admin';
      } catch {
        this.userName = 'User';
        this.userInitial = 'U';
      }
    }
  }
}
