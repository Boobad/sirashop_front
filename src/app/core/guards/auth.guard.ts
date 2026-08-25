import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const user = authService.getUser();

  // 1. Vérification des rôles
  const allowedRoles = route.data?.['roles'] as UserRole[];
  if (allowedRoles && !authService.hasRole(allowedRoles)) {
    if (user) {
      redirectToAllowedRoute(user, authService, router);
    }
    return false;
  }

  // 2. Vérification des modules actifs pour l'entreprise
  const requiredModule = route.data?.['module'] as 'SALES' | 'REPAIRS';
  if (requiredModule && user && user.role !== 'SUPER_ADMIN') {
    if (requiredModule === 'REPAIRS' && !authService.hasRepairs()) {
      toastService.warning('Le module SAV & Réparations n\'est pas activé pour votre entreprise.');
      redirectToAllowedRoute(user, authService, router);
      return false;
    }
    if (requiredModule === 'SALES' && !authService.hasSales()) {
      toastService.warning('Le module Ventes & Caisse n\'est pas activé pour votre entreprise.');
      redirectToAllowedRoute(user, authService, router);
      return false;
    }
  }

  return true;
};

function redirectToAllowedRoute(user: any, authService: AuthService, router: Router): void {
  if (user.role === 'SUPER_ADMIN') {
    router.navigate(['/super-admin']);
  } else if (user.role === 'COMPANY_OWNER') {
    router.navigate(['/company-owner']);
  } else if (authService.hasSales() && (user.role === 'SELLER' || user.role === 'MANAGER')) {
    router.navigate(['/pos']);
  } else if (authService.hasRepairs() && (user.role === 'TECHNICIAN' || user.role === 'REPAIRER')) {
    router.navigate(['/repair']);
  } else if (authService.hasSales()) {
    router.navigate(['/pos']);
  } else if (authService.hasRepairs()) {
    router.navigate(['/repair']);
  } else {
    router.navigate(['/login']);
  }
}
