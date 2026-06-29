import { Routes } from '@angular/router';

export const routes: Routes = [
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
    loadChildren: () => import('./booking/booking.routes').then(m => m.BOOKING_ROUTES)
  },
  {
    path: 'provider',
    loadChildren: () => import('./provider/provider.routes').then(m => m.PROVIDER_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '',
    redirectTo: 'map',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'map'
  }
];
