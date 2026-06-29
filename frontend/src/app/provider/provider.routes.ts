import { Routes } from '@angular/router';

export const PROVIDER_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./provider-dashboard/provider-dashboard.component').then(m => m.ProviderDashboardComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./provider-registration/provider-registration.component').then(m => m.ProviderRegistrationComponent)
  },
  {
    path: 'earnings',
    loadComponent: () => import('./earnings/earnings.component').then(m => m.EarningsComponent)
  },
  {
    path: 'requests',
    loadComponent: () => import('./booking-request-list/booking-request-list.component').then(m => m.BookingRequestListComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
