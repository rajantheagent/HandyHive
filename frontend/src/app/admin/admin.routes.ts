import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: 'verification',
    loadComponent: () => import('./provider-verification/provider-verification.component').then(m => m.ProviderVerificationComponent)
  },
  {
    path: 'disputes',
    loadComponent: () => import('./dispute-resolution/dispute-resolution.component').then(m => m.DisputeResolutionComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./report-export/report-export.component').then(m => m.ReportExportComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
