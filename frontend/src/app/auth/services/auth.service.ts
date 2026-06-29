import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  userId: string;
  message: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        this.storeTokens(response.accessToken, response.refreshToken);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  register(dto: RegisterDto): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, dto);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.storeTokens(response.accessToken, response.refreshToken);
      })
    );
  }

  loginWithOAuth(provider: 'google' | 'facebook'): void {
    window.location.href = `${this.apiUrl}/auth/${provider}`;
  }

  handleOAuthCallback(accessToken: string, refreshToken: string): void {
    this.storeTokens(accessToken, refreshToken);
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
        error: () => {} // Ignore errors during logout
      });
    }
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
