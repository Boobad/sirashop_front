import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data?.['roles'] as UserRole[];
  if (allowedRoles && !authService.hasRole(allowedRoles)) {
    const user = authService.getUser();
    if (user) {
      switch (user.role) {
        case 'SUPER_ADMIN': router.navigate(['/super-admin']); break;
        case 'COMPANY_OWNER': router.navigate(['/company-owner']); break;
        case 'SELLER':
        case 'MANAGER': router.navigate(['/pos']); break;
        case 'TECHNICIAN': router.navigate(['/repair']); break;
        default: router.navigate(['/login']);
      }
    }
    return false;
  }

  return true;
};
