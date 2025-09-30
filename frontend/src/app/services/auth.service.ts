import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'jobhunt_session';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSessionFromStorage();
  }

  /**
   * Check if user is currently authenticated
   */
  get isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Get current user
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login user with credentials
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      map(response => {
        // Backend returns: {success: true, token, user}
        // We need to extract the user and token
        if (!response.success) {
          throw new Error(response.error || 'Login failed');
        }
        return {
          user: response.user,
          token: response.token
        } as AuthResponse;
      }),
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.clearSession();
  }

  /**
   * Check if session is valid (for route guards)
   */
  isSessionValid(): Observable<boolean> {
    // Check if we have a stored session
    const session = this.getStoredSession();
    if (!session || !this.isSessionNotExpired(session)) {
      return of(false);
    }

    // Validate token with backend
    return this.http.get<any>(`${environment.apiUrl}/auth/me`).pipe(
      map(response => {
        // Backend returns: {success: true, user}
        if (response.success && response.user) {
          // Update current user data
          this.currentUserSubject.next(response.user);
          return true;
        }
        return false;
      }),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  /**
   * Set user session and store in localStorage
   */
  private setSession(authResponse: AuthResponse): void {
    const session = {
      user: authResponse.user,
      token: authResponse.token,
      timestamp: Date.now()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.currentUserSubject.next(authResponse.user);
  }

  /**
   * Clear user session
   */
  private clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Load session from localStorage on app init
   */
  private loadSessionFromStorage(): void {
    const session = this.getStoredSession();
    if (session && this.isSessionNotExpired(session)) {
      this.currentUserSubject.next(session.user);
    } else {
      this.clearSession();
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): any {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if session is not expired (24 hours)
   */
  private isSessionNotExpired(session: any): boolean {
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return Date.now() - session.timestamp < expirationTime;
  }

  /**
   * Get stored auth token for API requests
   */
  getAuthToken(): string | null {
    const session = this.getStoredSession();
    return session?.token || null;
  }

  /**
   * Mock login implementation (replace with actual API call)
   */
  private mockLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    // Simulate API delay
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Mock validation - replace with actual API call
        const validUsers = [
          { email: 'john.doe@email.com', password: 'password123' },
          { email: 'jane.smith@email.com', password: 'password123' },
          { email: 'test@example.com', password: 'password' }
        ];

        const user = validUsers.find(u =>
          u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
          return {
            user: {
              id: 1,
              email: user.email
            },
            token: `mock_token_${Date.now()}`
          } as AuthResponse;
        } else {
          throw new Error('Invalid email or password');
        }
      })
    );
  }
}