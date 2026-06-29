import { Routes } from '@angular/router';

export const BOOKING_ROUTES: Routes = [
  {
    path: 'request',
    loadComponent: () => import('./booking-request/booking-request.component').then(m => m.BookingRequestComponent)
  },
  {
    path: 'status/:id',
    loadComponent: () => import('./booking-status/booking-status.component').then(m => m.BookingStatusComponent)
  },
  {
    path: 'tracking/:id',
    loadComponent: () => import('./tracking-map/tracking-map.component').then(m => m.TrackingMapComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./booking-history/booking-history.component').then(m => m.BookingHistoryComponent)
  },
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full'
  }
];
