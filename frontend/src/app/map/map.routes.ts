import { Routes } from '@angular/router';

export const MAP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./map-view/map-view.component').then(m => m.MapViewComponent)
  }
];
