import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';

const PUBLIC_URLS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/verify-email', '/auth/change-password'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth header for public endpoints
  const isPublicUrl = PUBLIC_URLS.some(url => req.url.includes(url));
  if (isPublicUrl) {
    return next(req);
  }

  // Attach Bearer token
  const token = authService.getAccessToken();
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else {
    console.warn('[Interceptor] No token available for:', req.url);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('[Interceptor] Error', error.status, 'for:', req.url);
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Attempt token refresh with a 5-second timeout
        return authService.refreshToken().pipe(
          timeout(5000),
          switchMap(response => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` }
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            console.error('[Interceptor] Refresh failed:', refreshErr);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
