import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get the auth token
  const authToken = authService.getAuthToken();

  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (authToken) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
  }

  // Handle the request and catch authentication errors
  return next(authReq).pipe(
    catchError(error => {
      // If we get a 401 Unauthorized response, logout and redirect to login
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};