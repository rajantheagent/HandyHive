import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { inject } from '@angular/core';
import { AuthService } from './auth/services/auth.service';
import { Router } from '@angular/router';

// Guard that shows landing for guests, redirects logged-in users to dashboard
const landingGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
    canActivate: [landingGuard],
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'map',
    loadChildren: () => import('./map/map.routes').then(m => m.MAP_ROUTES)
  },
  {
    path: 'booking',
    loadChildren: () => import('./booking/booking.routes').then(m => m.BOOKING_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'provider',
    loadChildren: () => import('./provider/provider.routes').then(m => m.PROVIDER_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
