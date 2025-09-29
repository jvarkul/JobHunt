import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isSessionValid().pipe(
    take(1),
    map(isValid => {
      if (isValid && authService.isAuthenticated) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};

export const loginGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isSessionValid().pipe(
    take(1),
    map(isValid => {
      // If user is already authenticated, redirect to dashboard
      if (isValid && authService.isAuthenticated) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    })
  );
};