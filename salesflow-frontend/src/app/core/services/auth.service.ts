import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { tap, catchError } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sf_token';
  private _currentUser = signal<User | null>(null);
  private _token = signal<string | null>(this.loadToken());

  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => !!this._token());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }) {
    return this.http
      .post<ApiResponse<{ token: string; user: User }>>(
        `${environment.apiUrl}/auth/login`,
        credentials
      )
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.data.token);
          this._token.set(res.data.token);
          this._currentUser.set(res.data.user);
        })
      );
  }

  logout() {
    return this.http
      .post(`${environment.apiUrl}/auth/logout`, {})
      .pipe(
        // Ensure redirection and state clearing even on error
        tap(() => this.clearStateAndRedirect()),
        catchError((err) => {
          this.clearStateAndRedirect();
          throw err;
        })
      );
  }

  private clearStateAndRedirect() {
    localStorage.removeItem(this.TOKEN_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getMe() {
    return this.http
      .get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((res) => this._currentUser.set(res.data)));
  }

  getToken(): string | null {
    return this._token();
  }

  private loadToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return (token && token !== 'undefined' && token !== 'null') ? token : null;
  }
}
